import { NextRequest, NextResponse } from "next/server";
import BillingProduct from "@/models/billingProduct";
import {
  buildBillingSnapshot,
  createPurchaseRecord,
  ensureSubscriptionRecord,
  findCurrentSubscription,
  findPurchaseByUserAndIdempotency,
  syncCatalogProducts,
  updateBillingSubscriptionState,
} from "@/lib/billing/db";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getCatalogProduct } from "@/lib/billing/catalog";
import { createRazorpayPlan, createRazorpaySubscription } from "@/lib/billing/razorpay";
import { getRazorpayConfig } from "@/lib/billing/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const PENDING_SUBSCRIPTION_TTL_MS = 30 * 60 * 1000;

type SubscriptionBody = {
  productCode?: string;
  idempotencyKey?: string;
  source?: string;
  bridgeToken?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SubscriptionBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productCode = body.productCode?.trim() || "";
    const idempotencyKey = body.idempotencyKey?.trim() || `subscription:${auth.user._id}:${productCode}`;
    const product = getCatalogProduct(productCode);

    if (!product || product.kind !== "subscription") {
      return NextResponse.json({ error: "Invalid subscription product." }, { status: 400 });
    }

    const snapshot = await buildBillingSnapshot(auth.user, request);
    const pricedProduct = snapshot.catalog.find((item) => item.code === product.code);
    if (!pricedProduct) {
      return NextResponse.json({ error: "Product is not currently eligible for this user." }, { status: 403 });
    }
    const existingSubscription = await findCurrentSubscription(String(auth.user._id));
    const isFreshPendingSubscription =
      existingSubscription?.status === "payment_pending" &&
      Boolean(
        (existingSubscription.updatedAt || existingSubscription.createdAt) &&
          Date.now() -
            new Date(existingSubscription.updatedAt || existingSubscription.createdAt || Date.now()).getTime() <
            PENDING_SUBSCRIPTION_TTL_MS,
      );

    if (
      existingSubscription &&
      (["active", "cancel_scheduled"].includes(existingSubscription.status) || isFreshPendingSubscription)
    ) {
      return NextResponse.json({
        subscriptionId: existingSubscription.providerSubscriptionId,
        key: getRazorpayConfig().publicKeyId,
        product: pricedProduct,
        status: existingSubscription.status,
      });
    }

    await syncCatalogProducts();
    const productDoc = await BillingProduct.findOne({ code: product.code });
    if (!productDoc) {
      return NextResponse.json({ error: "Billing product not synced." }, { status: 500 });
    }

    const planKey = `${pricedProduct.currency}:${pricedProduct.amountPaise}:${snapshot.pricing.tier}`;
    const providerPlans = ((productDoc.metadata?.providerPlans || {}) as Record<string, string>);
    let providerPlanId = providerPlans[planKey];

    if (!providerPlanId) {
      const plan = await createRazorpayPlan({
        code: product.code,
        amountPaise: pricedProduct.amountPaise,
        currency: pricedProduct.currency,
        period: product.billingCycle === "monthly" ? "monthly" : "yearly",
        name: `${product.name} ${snapshot.pricing.tier.toUpperCase()} ${pricedProduct.currency}`,
        description: `${product.creditsGranted} yearly credits for ${product.name}`,
      });
      providerPlanId = plan.id;
      productDoc.providerPlanId ||= plan.id;
      productDoc.metadata = {
        ...(productDoc.metadata || {}),
        providerPlans: {
          ...providerPlans,
          [planKey]: plan.id,
        },
      };
      productDoc.markModified("metadata");
      await productDoc.save();
    }

    const existingPurchase = await findPurchaseByUserAndIdempotency(String(auth.user._id), idempotencyKey);
    const purchase =
      existingPurchase ||
      (await createPurchaseRecord({
        userId: String(auth.user._id),
        productCode: product.code,
        pricedProduct,
        pricing: snapshot.pricing,
        checkoutSource: body.source?.trim() || "billing_page",
        idempotencyKey,
        notes: {
          authType: auth.authType,
          pricingVersion: snapshot.pricingVersion,
          pricing: snapshot.pricing,
        },
      }));

    const subscription = await createRazorpaySubscription({
      planId: providerPlanId,
      notes: {
        userId: String(auth.user._id),
        email: auth.user.email,
        productCode: product.code,
        purchaseId: String(purchase._id),
        pricingVersion: snapshot.pricingVersion,
        pricingTier: snapshot.pricing.tier,
        pricingCountry: snapshot.pricing.country,
        currency: pricedProduct.currency,
      },
    });

    purchase.razorpaySubscriptionId = subscription.id;
    purchase.status = "pending";
    await purchase.save();

    await ensureSubscriptionRecord({
      userId: String(auth.user._id),
      planCode: product.code,
      providerPlanId,
      providerSubscriptionId: subscription.id,
      metadata: { purchaseId: String(purchase._id), pricing: snapshot.pricing },
      pricing: snapshot.pricing,
      amountSubunits: pricedProduct.amountPaise,
      basePriceInr: pricedProduct.basePriceInr,
    });

    await updateBillingSubscriptionState({
      userId: String(auth.user._id),
      planCode: product.code,
      status: "payment_pending",
      cancelAtCycleEnd: false,
    });

    return NextResponse.json({
      purchaseId: String(purchase._id),
      subscriptionId: subscription.id,
      key: getRazorpayConfig().publicKeyId,
      product: pricedProduct,
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/create error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create subscription." },
      { status },
    );
  }
}
