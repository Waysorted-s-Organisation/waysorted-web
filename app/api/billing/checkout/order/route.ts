import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, createPurchaseRecord, findPurchaseByUserAndIdempotency } from "@/lib/billing/db";
import { getCatalogProduct } from "@/lib/billing/catalog";
import { createRazorpayOrder } from "@/lib/billing/razorpay";
import { getRazorpayConfig } from "@/lib/billing/env";
import { randomUUID } from "crypto";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type OrderBody = {
  productCode?: string;
  idempotencyKey?: string;
  source?: string;
  quotedAmountSubunits?: number;
  quotedCurrency?: string;
  pricingVersion?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as OrderBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productCode = body.productCode?.trim() || "";
    const clientAttemptKey = body.idempotencyKey?.trim() || randomUUID();
    const idempotencyKey = `order:${auth.user._id}:${clientAttemptKey}`;
    const product = getCatalogProduct(productCode);

    if (!product || product.kind === "subscription") {
      return NextResponse.json({ error: "Invalid one-time product." }, { status: 400 });
    }

    const snapshot = await buildBillingSnapshot(auth.user, request);
    const pricedProduct = snapshot.catalog.find((item) => item.code === product.code);
    const allowed = Boolean(pricedProduct);
    if (!allowed) {
      return NextResponse.json({ error: "Product is not currently eligible for this user." }, { status: 403 });
    }
    // A quote is expected, but its ABSENCE must never block a payment. Server and client deploy at
    // the same instant, so a browser still running the previously cached bundle sends no quote -
    // rejecting those requests breaks checkout for every open session until they hard-reload.
    // Warn loudly instead, so stale clients are visible, and enforce strictly whenever a quote
    // IS supplied (which is the case that actually protects the customer from a silent reprice).
    const hasQuote =
      body.quotedAmountSubunits !== undefined &&
      body.quotedCurrency !== undefined &&
      body.pricingVersion !== undefined;

    if (!hasQuote) {
      console.warn("[billing] checkout/order called without a price quote", {
        userId: String(auth.user._id),
        productCode: product.code,
        authType: auth.authType,
      });
    }

    if (
      hasQuote &&
      (body.quotedAmountSubunits !== pricedProduct!.amountPaise ||
        body.quotedCurrency!.toUpperCase() !== pricedProduct!.currency.toUpperCase() ||
        body.pricingVersion !== snapshot.pricingVersion)
    ) {
      return NextResponse.json(
        {
          error: "Pricing changed before checkout. Review the updated amount.",
          code: "pricing_quote_changed",
          quoted: {
            amountSubunits: body.quotedAmountSubunits,
            currency: body.quotedCurrency?.toUpperCase(),
          },
          current: {
            amountSubunits: pricedProduct!.amountPaise,
            currency: pricedProduct!.currency.toUpperCase(),
          },
        },
        { status: 409 },
      );
    }

    const existingPurchase = await findPurchaseByUserAndIdempotency(String(auth.user._id), idempotencyKey);
    const existingAgeMs = existingPurchase?.createdAt
      ? Date.now() - new Date(existingPurchase.createdAt).getTime()
      : Number.POSITIVE_INFINITY;
    const canReuseExisting = Boolean(
      existingPurchase &&
      existingPurchase.productCode === product.code &&
      ["created", "pending"].includes(existingPurchase.status) &&
      existingAgeMs < 30 * 60_000 &&
      // The reuse branch returns the ORIGINAL order's amount and currency. Reusing a record whose
      // price no longer matches the quote just validated would charge the customer an amount they
      // were never shown - the guard above would pass while the old price is what actually bills.
      existingPurchase.amountPaise === pricedProduct!.amountPaise &&
      existingPurchase.currency.toUpperCase() === pricedProduct!.currency.toUpperCase(),
    );
    if (existingPurchase && !canReuseExisting) {
      return NextResponse.json(
        { error: "This checkout attempt has expired or already completed. Start a new attempt." },
        { status: 409 },
      );
    }
    if (canReuseExisting && existingPurchase?.razorpayOrderId) {
      return NextResponse.json({
        purchaseId: String(existingPurchase._id),
        orderId: existingPurchase.razorpayOrderId,
        amount: existingPurchase.amountPaise,
        currency: existingPurchase.currency,
        key: getRazorpayConfig().publicKeyId,
        product: pricedProduct || product,
      });
    }

    const purchase =
      (canReuseExisting ? existingPurchase : null) ||
      (await createPurchaseRecord({
        userId: String(auth.user._id),
        productCode: product.code,
        pricedProduct,
        pricing: snapshot.pricing,
        checkoutSource: body.source?.trim() || "billing_page",
        idempotencyKey,
        notes: {
          authType: auth.authType,
          pricing: snapshot.pricing,
        },
      }));

    const order = await createRazorpayOrder({
      amountPaise: purchase.amountPaise,
      currency: purchase.currency,
      receipt: purchase.receipt,
      notes: {
        purchaseId: String(purchase._id),
        userId: String(auth.user._id),
        productCode: purchase.productCode,
        kind: purchase.kind,
        pricingTier: purchase.pricingTier || snapshot.pricing.tier,
        pricingCountry: purchase.pricingCountry || snapshot.pricing.country,
      },
    });

    purchase.razorpayOrderId = order.id;
    purchase.status = "pending";
    await purchase.save();

    return NextResponse.json({
      purchaseId: String(purchase._id),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: getRazorpayConfig().publicKeyId,
      product: pricedProduct || product,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/order error:", error);
    return billingErrorResponse(error, "Unable to create Razorpay order.", "checkout_order_failed");
  }
}
