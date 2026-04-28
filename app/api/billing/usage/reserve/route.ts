import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, expireStaleReservations, reserveCredits } from "@/lib/billing/db";
import { getFeaturePricingRule, resolveImportPricing } from "@/lib/billing/catalog";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ReserveBody = {
  featureCode?: string;
  toolCode?: string;
  sizeBytes?: number;
  selectedOptions?: Record<string, unknown>;
  processor?: string;
  idempotencyKey?: string;
  bridgeToken?: string;
};

function resolveCredits(body: ReserveBody) {
  if (!body.featureCode?.trim()) {
    throw new Error("Missing featureCode.");
  }

  if (body.featureCode === "import_file") {
    if (!body.toolCode?.trim() || typeof body.sizeBytes !== "number") {
      throw new Error("Import pricing requires toolCode and sizeBytes.");
    }

    const importRule = resolveImportPricing(body.toolCode, body.sizeBytes);
    if (!importRule) {
      throw new Error("Unsupported import size or tool.");
    }

    return {
      creditsRequired: importRule.credits,
      featureCode: importRule.featureCode,
      sizeBucket: importRule.sizeLabel,
      requiresSubscription: false,
    };
  }

  const rule = getFeaturePricingRule(body.featureCode);
  if (!rule) {
    throw new Error("Unknown feature code.");
  }

  return {
    creditsRequired: rule.credits,
    featureCode: rule.featureCode,
    sizeBucket: null,
    requiresSubscription: Boolean(rule.requiresSubscription),
  };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    await expireStaleReservations();

    const body = (await request.json().catch(() => ({}))) as ReserveBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolved = resolveCredits(body);
    const snapshot = await buildBillingSnapshot(auth.user);

    if (resolved.requiresSubscription && !snapshot.capabilities.customizablePresets) {
      return NextResponse.json(
        { error: "This feature requires an active subscription." },
        { status: 403 },
      );
    }

    if (resolved.creditsRequired === 0) {
      return NextResponse.json({
        status: "free",
        featureCode: resolved.featureCode,
        creditsReserved: 0,
      });
    }

    const reservation = await reserveCredits({
      userId: String(auth.user._id),
      featureCode: resolved.featureCode,
      toolCode: body.toolCode?.trim() || null,
      sizeBucket: resolved.sizeBucket,
      creditsRequired: resolved.creditsRequired,
      processor: body.processor?.trim() || null,
      selectedOptions: body.selectedOptions || {},
      idempotencyKey:
        body.idempotencyKey?.trim() ||
        `reserve:${auth.user._id}:${resolved.featureCode}:${Date.now()}`,
    });

    return NextResponse.json({
      reservationId: String(reservation._id),
      status: reservation.status,
      featureCode: reservation.featureCode,
      creditsReserved: reservation.creditsReserved,
      expiresAt: reservation.expiresAt,
      processorToken: reservation.processorToken,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/reserve error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reserve credits." },
      { status },
    );
  }
}
