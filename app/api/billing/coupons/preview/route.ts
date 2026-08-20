import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot } from "@/lib/billing/db";
import { getCatalogProduct } from "@/lib/billing/catalog";
import { resolveCoupon, resolveBestOfferForUser } from "@/lib/billing/coupon";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * The authoritative discount for a code, before checkout.
 *
 * This endpoint exists because the client cannot compute it. The checkout quote
 * guard compares the client's figure against the server's own upfront, so a
 * client that guesses — from a hardcoded percent table, or from a previous
 * response — 409s on every attempt. It has to ask.
 *
 * Read-only: no reservation is taken, nothing is written. The claim happens in
 * subscriptions/create, which re-resolves and is the real authority. A preview
 * that succeeded can still be refused at checkout if the balance moved or the
 * code was exhausted in between, and that is correct.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      productCode?: string;
      couponCode?: string;
    };

    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = (body.couponCode || "").trim().toUpperCase();
    const product = getCatalogProduct((body.productCode || "").trim());
    if (!product || product.kind !== "subscription") {
      return NextResponse.json({ error: "Invalid coupon request." }, { status: 400 });
    }

    // Bounded before it reaches a database query. A code is a short token; an
    // unbounded string here becomes an unbounded index lookup.
    if (code.length > 64) {
      return NextResponse.json(
        { valid: false, reason: "coupon_not_found" },
        { status: 200 },
      );
    }

    const snapshot = await buildBillingSnapshot(auth.user, request);
    const pricedProduct = snapshot.catalog.find((item) => item.code === product.code);
    if (!pricedProduct) {
      return NextResponse.json({ error: "Product is not available." }, { status: 403 });
    }

    // No code supplied: answer "what could this customer use", so the checkout
    // banner can advertise a real offer instead of fixed copy. Same resolution
    // path as a named code, so anything offered here will be honoured.
    if (!code) {
      const best = await resolveBestOfferForUser({
        userId: String(auth.user._id),
        productCode: product.code,
        amountPaise: pricedProduct.amountPaise,
        currency: pricedProduct.currency,
        creditsRemaining: snapshot.wallet?.availableCredits ?? null,
        heldCredits: snapshot.wallet?.heldCredits ?? null,
      });
      if (!best) return NextResponse.json({ offer: null });
      return NextResponse.json({
        offer: {
          code: best.code,
          percent: best.percent,
          discountSubunits: best.discountPaise,
          upfrontSubunits: best.upfrontAmountPaise,
          recurringSubunits: best.originalAmountPaise,
          currency: pricedProduct.currency,
        },
      });
    }

    const resolution = await resolveCoupon({
      code,
      userId: String(auth.user._id),
      productCode: product.code,
      amountPaise: pricedProduct.amountPaise,
      currency: pricedProduct.currency,
      creditsRemaining: snapshot.wallet?.availableCredits ?? null,
      heldCredits: snapshot.wallet?.heldCredits ?? null,
    });

    // 200 either way. A rejected code is an answer, not an error, and the
    // client shows the reason rather than a failure state.
    if (!resolution.ok) {
      return NextResponse.json({ valid: false, reason: resolution.reason });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: resolution.quote.code,
        percent: resolution.quote.percent,
        discountSubunits: resolution.quote.discountPaise,
        upfrontSubunits: resolution.quote.upfrontAmountPaise,
        recurringSubunits: resolution.quote.originalAmountPaise,
        currency: pricedProduct.currency,
      },
    });
  } catch (error) {
    console.error("POST /api/billing/coupons/preview error:", error);
    return billingErrorResponse(error, "Unable to check that code.", "coupon_preview_failed");
  }
}
