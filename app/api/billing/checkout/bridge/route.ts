import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { normalizeCouponCode } from "@/lib/billing/coupon-code";
import BillingBridgeGrant from "@/models/billingBridgeGrant";
import { createHash, randomBytes } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type BridgeRequestBody = {
  productCode?: unknown;
  couponCode?: unknown;
  returnPath?: unknown;
  source?: unknown;
};

/**
 * Every field here arrives as parsed JSON from the Figma plugin, so any of them
 * can be a number, an object or an array. `body.x?.trim()` throws a TypeError on
 * those and the route answers 500, which the plugin reads as "bridge down" and
 * falls back to opening the marketing page - losing the checkout the customer
 * asked for. Coerced to a string first, then bounded.
 */
function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as BridgeRequestBody;

    // Shape-checked here so a malformed code cannot be written to the grant and
    // reflected into the redirect later. Whether the code is live and applies to
    // this customer is decided at checkout, against the database, with their
    // balance in hand - never here.
    const couponCode = normalizeCouponCode(body.couponCode);

    const expiresAt = new Date(Date.now() + 90_000);
    const code = randomBytes(32).toString("base64url");
    const codeHash = createHash("sha256").update(code).digest("hex");
    await BillingBridgeGrant.create({
      user: auth.user._id,
      codeHash,
      productCode: text(body.productCode, 64),
      couponCode,
      returnPath: text(body.returnPath, 512) || "/billing",
      source: text(body.source, 64) || auth.authType,
      expiresAt,
    });

    const url = new URL("/api/billing/checkout/bridge/exchange", request.nextUrl.origin);
    url.searchParams.set("code", code);

    return NextResponse.json({
      expiresAt: expiresAt.toISOString(),
      url: url.toString(),
      // Echoed so the plugin can tell whether the code it sent survived the
      // shape check. Silently dropping it is how a customer gets charged full
      // price after being shown a discount.
      couponCode,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/bridge error:", error);
    return NextResponse.json({ error: "Unable to create checkout bridge." }, { status: 500 });
  }
}
