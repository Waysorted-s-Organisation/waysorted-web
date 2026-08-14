import { NextRequest, NextResponse } from "next/server";
import BillingProduct from "@/models/billingProduct";
import {
  buildBillingSnapshot,
  createPurchaseRecord,
  ensureSubscriptionRecord,
  findCurrentSubscription,
  findPurchaseByUserAndIdempotency,
  releaseSupersededPendingSubscription,
  syncCatalogProducts,
  updateBillingSubscriptionState,
} from "@/lib/billing/db";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getCatalogProduct } from "@/lib/billing/catalog";
import {
  cancelRazorpaySubscription,
  createRazorpayPlan,
  createRazorpaySubscription,
} from "@/lib/billing/razorpay";
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
    // The quote is REQUIRED. It used to be optional, which meant a caller that simply omitted the
    // field disabled the check entirely and was charged whatever the server computed.
    if (
      body.quotedAmountSubunits === undefined ||
      body.quotedCurrency === undefined ||
      body.pricingVersion === undefined
    ) {
      return NextResponse.json(
        { error: "A price quote is required to start checkout.", code: "missing_price_quote" },
        { status: 400 },
      );
    }
    if (
      body.quotedAmountSubunits !== pricedProduct.amountPaise ||
      body.quotedCurrency.toUpperCase() !== pricedProduct.currency.toUpperCase() ||
      body.pricingVersion !== snapshot.pricingVersion
    ) {
      return NextResponse.json(
        {
          error: "Pricing changed before checkout. Review the updated amount.",
          code: "pricing_quote_changed",
          quoted: {
            amountSubunits: body.quotedAmountSubunits,
            currency: body.quotedCurrency.toUpperCase(),
          },
          current: {
            amountSubunits: pricedProduct.amountPaise,
            currency: pricedProduct.currency.toUpperCase(),
          },
        },
        { status: 409 },
      );
    }
    const existingSubscription = await findCurrentSubscription(String(auth.user._id));
    const isPendingSubscription = existingSubscription?.status === "payment_pending";
    const isFreshPendingSubscription =
      isPendingSubscription &&
      Boolean(
        (existingSubscription.updatedAt || existingSubscription.createdAt) &&
          Date.now() -
            new Date(existingSubscription.updatedAt || existingSubscription.createdAt || Date.now()).getTime() <
            PENDING_SUBSCRIPTION_TTL_MS,
      );

    // A payment_pending row is covered by the unique `one_live_subscription_per_user` partial index.
    // Falling through to create a second one therefore ALWAYS fails with E11000 - after a live,
    // customer-payable Razorpay subscription has already been created and leaked. The customer sees
    // "Unable to create subscription" and can never pay again, and every retry leaks another.
    // A stale pending row for the SAME plan is reusable: the provider subscription is still payable.
    const isReusablePendingSubscription =
      isPendingSubscription &&
      existingSubscription.planCode === product.code &&
      Boolean(existingSubscription.providerSubscriptionId);

    // A live (paying) subscription is never touched automatically - the customer must cancel it.
    if (
      existingSubscription &&
      ["active", "cancel_scheduled"].includes(existingSubscription.status)
    ) {
      return NextResponse.json(
        {
          error:
            existingSubscription.planCode === product.code
              ? "You already have this subscription."
              : "A different subscription is already active. Cancel it before choosing another plan.",
          code:
            existingSubscription.planCode === product.code
              ? "subscription_already_active"
              : "subscription_plan_change_required",
        },
        { status: 409 },
      );
    }

    const pendingTierMatches =
      !existingSubscription?.pricingTier ||
      existingSubscription.pricingTier === snapshot.pricing.tier;

    if (
      existingSubscription &&
      (isFreshPendingSubscription || isReusablePendingSubscription) &&
      existingSubscription.planCode === product.code &&
      // Reusing a provider subscription created at a different tier would show the customer one
      // amount while Razorpay charges another. When the tier moved, fall through and reclaim.
      pendingTierMatches
    ) {
      return NextResponse.json({
        subscriptionId: existingSubscription.providerSubscriptionId,
        key: getRazorpayConfig().publicKeyId,
        product: pricedProduct,
        status: existingSubscription.status,
      });
    }

    // A pending row that cannot be reused still occupies the unique
    // `one_live_subscription_per_user` slot. Release it BEFORE creating anything at the provider,
    // otherwise ensureSubscriptionRecord fails with E11000 after a payable Razorpay subscription
    // has already been created - which is what permanently blocked checkout.
    if (existingSubscription && isPendingSubscription) {
      const staleProviderSubscriptionId = existingSubscription.providerSubscriptionId;
      await releaseSupersededPendingSubscription(String(existingSubscription._id));
      if (staleProviderSubscriptionId) {
        // Best effort: stop the abandoned provider subscription so it can never bill the customer.
        try {
          await cancelRazorpaySubscription(staleProviderSubscriptionId, false);
        } catch (cancelError) {
          console.error("Failed to cancel superseded pending subscription", {
            providerSubscriptionId: staleProviderSubscriptionId,
            error: cancelError instanceof Error ? cancelError.message : String(cancelError),
          });
        }
      }
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
    // A duplicate-key error here means another live subscription row still occupies the unique
    // `one_live_subscription_per_user` slot. Surfacing that as an opaque 500 is what made checkout
    // look permanently broken; tell the customer what to do instead.
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        {
          error:
            "You already have a subscription in progress. Refresh this page, or cancel the pending subscription and try again.",
          code: "subscription_already_in_progress",
        },
        { status: 409 },
      );
    }
    return billingErrorResponse(error, "Unable to create subscription.", "subscription_create_failed");
  }
}
