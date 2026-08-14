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
import {
  buildSubscriptionCheckoutStartedEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
import { randomUUID } from "crypto";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const PENDING_SUBSCRIPTION_TTL_MS = 30 * 60 * 1000;

type SubscriptionBody = {
  productCode?: string;
  idempotencyKey?: string;
  source?: string;
  quotedAmountSubunits?: number;
  quotedCurrency?: string;
  pricingVersion?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SubscriptionBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productCode = body.productCode?.trim() || "";
    const clientAttemptKey = body.idempotencyKey?.trim() || randomUUID();
    const idempotencyKey = `subscription:${auth.user._id}:${clientAttemptKey}`;
    const product = getCatalogProduct(productCode);

    if (!product || product.kind !== "subscription") {
      return NextResponse.json({ error: "Invalid subscription product." }, { status: 400 });
    }

    const snapshot = await buildBillingSnapshot(auth.user, request);
    const pricedProduct = snapshot.catalog.find((item) => item.code === product.code);
    if (!pricedProduct) {
      return NextResponse.json({ error: "Product is not currently eligible for this user." }, { status: 403 });
    }
    if (
      body.quotedAmountSubunits !== undefined &&
      (body.quotedAmountSubunits !== pricedProduct.amountPaise ||
        body.quotedCurrency?.toUpperCase() !== pricedProduct.currency.toUpperCase() ||
        body.pricingVersion !== snapshot.pricingVersion)
    ) {
      return NextResponse.json(
        { error: "Pricing changed before checkout. Review the updated amount.", code: "pricing_quote_changed" },
        { status: 409 },
      );
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
      if (existingSubscription.planCode !== product.code) {
        return NextResponse.json(
          {
            error:
              "A different subscription is already active or awaiting payment. Cancel it before choosing another plan.",
            code: "subscription_plan_change_required",
          },
          { status: 409 },
        );
      }
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

    await emitNotificationEvent(buildSubscriptionCheckoutStartedEvent({
      userId: String(auth.user._id),
      email: auth.user.email,
      name: auth.user.name || null,
      purchaseId: String(purchase._id),
      subscriptionId: subscription.id,
      productCode: product.code,
      amountSubunits: pricedProduct.amountPaise,
      currency: pricedProduct.currency,
      pricingTier: snapshot.pricing.tier,
      pricingCountry: snapshot.pricing.country,
    }));

    return NextResponse.json({
      purchaseId: String(purchase._id),
      subscriptionId: subscription.id,
      key: getRazorpayConfig().publicKeyId,
      product: pricedProduct,
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/create error:", error);
    return billingErrorResponse(error, "Unable to create subscription.", "subscription_create_failed");
  }
}
