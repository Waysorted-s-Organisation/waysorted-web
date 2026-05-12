import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, expireStaleReservations, reserveCredits } from "@/lib/billing/db";
import { resolveUsageCredits } from "@/lib/billing/usagePricing";
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

    const resolved = resolveUsageCredits(body);
    const snapshot = await buildBillingSnapshot(auth.user, request);

    if (resolved.requiresSubscription && !snapshot.capabilities.customizablePresets) {
      return NextResponse.json(
        {
          error: "This feature requires an active subscription.",
          featureCode: resolved.featureCode,
          creditsRequired: resolved.creditsRequired,
          requiresBilling: true,
          requiresCheckout: true,
          checkoutTarget: "/pricing",
          reason: "subscription_required",
        },
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
    const message = error instanceof Error ? error.message : "Unable to reserve credits.";

    if (status === 409 && /insufficient credits/i.test(message)) {
      return NextResponse.json(
        {
          error: message,
          requiresBilling: true,
          requiresCheckout: true,
          checkoutTarget: "/pricing",
          reason: "insufficient_credits",
        },
        { status },
      );
    }

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
