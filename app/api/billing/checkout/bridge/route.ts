import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import BillingBridgeGrant from "@/models/billingBridgeGrant";
import { createHash, randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type BridgeRequestBody = {
  productCode?: string;
  returnPath?: string;
  source?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as BridgeRequestBody;
    const expiresAt = new Date(Date.now() + 90_000);
    const code = randomBytes(32).toString("base64url");
    const codeHash = createHash("sha256").update(code).digest("hex");
    await BillingBridgeGrant.create({
      user: auth.user._id,
      codeHash,
      productCode: body.productCode?.trim() || null,
      returnPath: body.returnPath?.trim() || "/billing",
      source: body.source?.trim() || auth.authType,
      expiresAt,
    });

    const url = new URL("/api/billing/checkout/bridge/exchange", request.nextUrl.origin);
    url.searchParams.set("code", code);

    return NextResponse.json({
      expiresAt: expiresAt.toISOString(),
      url: url.toString(),
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/bridge error:", error);
    return NextResponse.json({ error: "Unable to create checkout bridge." }, { status: 500 });
  }
}
