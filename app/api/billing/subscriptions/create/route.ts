import { NextRequest, NextResponse } from "next/server";
import BillingProduct from "@/models/billingProduct";
import {
  buildBillingSnapshot,
  createPurchaseRecord,
  ensureSubscriptionRecord,
  findCurrentSubscription,
  findPurchaseBySubscriptionId,
  markSubscriptionCancellationPending,
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
import { normalizeUtmAttribution, type UtmAttribution } from "@/lib/utm-attribution";

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
  attribution?: UtmAttribution;
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
    const attribution = normalizeUtmAttribution(body.attribution);
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
    // Matches checkout/order: a MISSING quote must never block a payment, because server and client
    // deploy at the same instant and a browser on the previously cached bundle sends none. Warn so
    // stale clients stay visible, and enforce strictly whenever a quote IS supplied.
    const hasQuote =
      body.quotedAmountSubunits !== undefined &&
      body.quotedCurrency !== undefined &&
      body.pricingVersion !== undefined;

    if (!hasQuote) {
      console.warn("[billing] subscriptions/create called without a price quote", {
        userId: String(auth.user._id),
        productCode: product.code,
        authType: auth.authType,
      });
    }

    if (
      hasQuote &&
      (body.quotedAmountSubunits !== pricedProduct.amountPaise ||
        body.quotedCurrency!.toUpperCase() !== pricedProduct.currency.toUpperCase() ||
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
            amountSubunits: pricedProduct.amountPaise,
            currency: pricedProduct.currency.toUpperCase(),
          },
        },
        { status: 409 },
      );
    }
    const existingSubscription = await findCurrentSubscription(String(auth.user._id));

    // Every status in the unique `one_live_subscription_per_user` partial index occupies the slot,
    // so ANY of them makes a second create fail with E11000 - after a live, customer-payable
    // Razorpay subscription has already been created and leaked. "halted" blocks exactly like
    // "payment_pending" did, and the UI offers no way to clear it, so the customer is locked out
    // permanently while each retry leaks another payable subscription.
    const isReclaimableSubscription =
      existingSubscription?.status === "payment_pending" ||
      existingSubscription?.status === "halted";
    const isFreshPendingSubscription =
      existingSubscription?.status === "payment_pending" &&
      Boolean(
        (existingSubscription.updatedAt || existingSubscription.createdAt) &&
          Date.now() -
            new Date(existingSubscription.updatedAt || existingSubscription.createdAt || Date.now()).getTime() <
            PENDING_SUBSCRIPTION_TTL_MS,
      );

    // A stale pending row for the SAME plan is reusable: the provider subscription is still payable.
    // "halted" is NOT reusable - Razorpay has stopped it, so it must be reclaimed and replaced.
    const isReusablePendingSubscription =
      existingSubscription?.status === "payment_pending" &&
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

    // The provider plan is keyed by `${currency}:${amountPaise}:${tier}` (see planKey below), so
    // matching on planCode and tier alone is not enough: a stale row can be bound to a plan at a
    // different amount or currency and would charge something other than the amount just displayed.
    // Compare the full identity, and fall through to reclaim whenever any part of it has moved.
    const reusedPlanIdentityMatches =
      Boolean(existingSubscription) &&
      existingSubscription!.planCode === product.code &&
      (!existingSubscription!.pricingTier ||
        existingSubscription!.pricingTier === snapshot.pricing.tier) &&
      (existingSubscription!.amountSubunits === undefined ||
        existingSubscription!.amountSubunits === null ||
        existingSubscription!.amountSubunits === pricedProduct.amountPaise) &&
      (!existingSubscription!.pricingCurrency ||
        existingSubscription!.pricingCurrency.toUpperCase() ===
          pricedProduct.currency.toUpperCase());

    if (
      existingSubscription &&
      (isFreshPendingSubscription || isReusablePendingSubscription) &&
      reusedPlanIdentityMatches
    ) {
      // The reuse branch MUST return a purchaseId. /subscriptions/verify rejects a request without
      // one ("Missing verification fields."), so omitting it means the customer completes the
      // mandate, is charged, and then sees a failure - and because verify is the only writer of
      // notes.clientSubscriptionConfirmation, the nightly reconciler would later read its absence
      // as "never paid" and cancel the subscription they just authorised.
      const reusedPurchase = await findPurchaseBySubscriptionId(
        String(auth.user._id),
        existingSubscription.providerSubscriptionId,
      );
      return NextResponse.json({
        purchaseId: reusedPurchase ? String(reusedPurchase._id) : undefined,
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
    if (existingSubscription && isReclaimableSubscription) {
      const staleProviderSubscriptionId = existingSubscription.providerSubscriptionId;
      const released = await releaseSupersededPendingSubscription(
        String(existingSubscription._id),
        existingSubscription.status,
      );
      // The release is a conditional update, so a null result means a concurrent request already
      // claimed this row. Continuing would create a second provider subscription that E11000s on
      // insert and is then leaked, payable, with nothing tracking it.
      if (!released) {
        return NextResponse.json(
          {
            error: "Another checkout for this account is already in progress. Refresh and try again.",
            code: "subscription_already_in_progress",
          },
          { status: 409 },
        );
      }

      if (staleProviderSubscriptionId) {
        try {
          await cancelRazorpaySubscription(staleProviderSubscriptionId, false);
        } catch (cancelError) {
          // The local row is already released, so checkout can proceed - but an uncancelled
          // provider subscription can still charge the customer, and a later charge event would
          // have no matching live row. Record it so the reconciler can find and cancel it.
          console.error("[billing] superseded provider subscription could not be cancelled", {
            providerSubscriptionId: staleProviderSubscriptionId,
            userId: String(auth.user._id),
            error: cancelError instanceof Error ? cancelError.message : String(cancelError),
          });
          await markSubscriptionCancellationPending(String(existingSubscription._id)).catch(() => null);
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
        attribution,
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
        ...(purchase.attribution?.utmSource
          ? { utmSource: purchase.attribution.utmSource }
          : {}),
        ...(purchase.attribution?.utmCampaign
          ? { utmCampaign: purchase.attribution.utmCampaign }
          : {}),
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
      metadata: {
        purchaseId: String(purchase._id),
        pricing: snapshot.pricing,
        ...(purchase.attribution ? { attribution: purchase.attribution } : {}),
      },
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
