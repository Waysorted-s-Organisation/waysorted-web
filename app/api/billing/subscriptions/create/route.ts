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
  fetchRazorpaySubscription,
} from "@/lib/billing/razorpay";
import { getRazorpayConfig } from "@/lib/billing/env";
import {
  buildSubscriptionCheckoutStartedEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
import { randomUUID } from "crypto";
import { billingErrorResponse } from "@/lib/billing/http-errors";
import {
  attachSubscriptionToRedemption,
  releaseCoupon,
  reserveCoupon,
  resolveCoupon,
} from "@/lib/billing/coupon";
import { couponScopedIdempotencyKey } from "@/lib/billing/coupon-discount";

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
  couponCode?: string;
};

/** Seconds in one billing cycle, used to place `start_at` one full cycle out. */
function cycleSeconds(billingCycle: string): number {
  return billingCycle === "monthly" ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60;
}

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
    const requestedCouponCode = body.couponCode?.trim().toUpperCase() || "";
    const clientAttemptKey = body.idempotencyKey?.trim() || randomUUID();
    // The coupon is part of checkout identity. Without it, a coupon applied on
    // a retry would reuse a full-price Purchase by idempotency key - skipping
    // createPurchaseRecord entirely - while Razorpay charged the discounted
    // upfront, and verify compares the payment against that row.
    const idempotencyKey = couponScopedIdempotencyKey(
      `subscription:${auth.user._id}:${clientAttemptKey}`,
      requestedCouponCode,
    );
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

    // Resolved BEFORE the reuse branch below, because the branch's decision
    // depends on whether a coupon is in play.
    let couponResolution: Awaited<ReturnType<typeof resolveCoupon>> | null = null;
    if (requestedCouponCode) {
      couponResolution = await resolveCoupon({
        code: requestedCouponCode,
        userId: String(auth.user._id),
        productCode: product.code,
        amountPaise: pricedProduct.amountPaise,
        currency: pricedProduct.currency,
        creditsRemaining: snapshot.wallet?.availableCredits ?? null,
      heldCredits: snapshot.wallet?.heldCredits ?? null,
      });
      if (!couponResolution.ok) {
        return NextResponse.json(
          {
            error: "That code cannot be applied to this plan.",
            code: "coupon_invalid",
            reason: couponResolution.reason,
          },
          { status: 409 },
        );
      }
    }

    // With a coupon the customer is charged the UPFRONT, so that is what the
    // client quoted and what must be compared. Comparing against the full price
    // would 409 every coupon checkout.
    const chargeAmountSubunits = couponResolution?.ok
      ? couponResolution.quote.upfrontAmountPaise
      : pricedProduct.amountPaise;

    if (
      hasQuote &&
      (body.quotedAmountSubunits !== chargeAmountSubunits ||
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
            amountSubunits: chargeAmountSubunits,
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
    // "scheduled" is a live, paid mandate whose first charge is booked ahead -
    // the resting state of every discounted subscription for its whole first
    // cycle. It occupies the unique one_live_subscription_per_user slot, so
    // omitting it here let the customer fall past every guard to
    // createRazorpaySubscription and then E11000 on insert, leaking a payable
    // provider subscription with nothing tracking it.
    if (
      existingSubscription &&
      ["active", "cancel_scheduled", "scheduled"].includes(existingSubscription.status)
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

    // An existing pending subscription was created WITHOUT an addon. Reusing it
    // for a coupon request would charge full price while the UI promised a
    // discount - and verify would agree, because the purchase row would also be
    // full price. Fall through and reclaim instead.
    const existingSubscriptionCouponCode =
      ((existingSubscription?.metadata as Record<string, unknown> | undefined)?.couponCode as
        | string
        | undefined) || null;

    // Must match in BOTH directions. The earlier version short-circuited to true
    // whenever no coupon was requested, so a pending subscription still carrying
    // a discount addon was handed back to a full-price request: the page showed
    // the list price and Razorpay charged the discounted upfront. The plan
    // identity check cannot catch that, because the plan genuinely IS full price
    // — the discount lives only in the addon.
    const reusedSubscriptionHonoursCoupon =
      existingSubscriptionCouponCode === (couponResolution?.ok ? couponResolution.quote.code : null);

    if (
      existingSubscription &&
      (isFreshPendingSubscription || isReusablePendingSubscription) &&
      reusedPlanIdentityMatches &&
      reusedSubscriptionHonoursCoupon
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

      // This branch returned no coupon block at all, so a customer retrying a
      // discounted checkout was charged the discounted addon while the printed
      // "Order complete" stated the LIST price with no discount line - a
      // receipt that contradicted the money actually taken.
      //
      // Every number is read off the reused row rather than re-quoted: the
      // addon amount was frozen on the first attempt and is what Razorpay will
      // capture, and this is the exact row subscriptions/verify compares the
      // payment against. A fresh quote can have moved since.
      const reusedCouponCode = reusedPurchase?.couponCode || null;
      let reusedCoupon: {
        code: string;
        percent: number;
        discountSubunits: number;
        upfrontSubunits: number;
        recurringSubunits: number;
        currency: string;
      } | null = null;

      if (reusedPurchase && reusedCouponCode) {
        const upfrontSubunits = reusedPurchase.amountPaise;
        const recurringSubunits = reusedPurchase.originalAmountPaise ?? pricedProduct.amountPaise;
        const discountSubunits =
          reusedPurchase.discountPaise ?? Math.max(recurringSubunits - upfrontSubunits, 0);
        reusedCoupon = {
          code: reusedCouponCode,
          // Derived from the frozen amounts so the "% off" on the receipt cannot
          // contradict the discount line printed beside it. The live resolution
          // is only a fallback for when the stored price is unusable as a
          // denominator.
          percent:
            recurringSubunits > 0
              ? Math.round((discountSubunits * 100) / recurringSubunits)
              : couponResolution?.ok
                ? couponResolution.quote.percent
                : 0,
          discountSubunits,
          upfrontSubunits,
          recurringSubunits,
          currency: reusedPurchase.currency,
        };
      }

      return NextResponse.json({
        purchaseId: reusedPurchase ? String(reusedPurchase._id) : undefined,
        subscriptionId: existingSubscription.providerSubscriptionId,
        key: getRazorpayConfig().publicKeyId,
        product: pricedProduct,
        status: existingSubscription.status,
        ...(reusedCoupon
          ? { coupon: reusedCoupon }
          : couponResolution?.ok
            ? {
                coupon: {
                  code: couponResolution.quote.code,
                  percent: couponResolution.quote.percent,
                  discountSubunits: couponResolution.quote.discountPaise,
                  upfrontSubunits: couponResolution.quote.upfrontAmountPaise,
                  recurringSubunits: couponResolution.quote.originalAmountPaise,
                  currency: pricedProduct.currency,
                },
              }
            : {}),
      });
    }

    // A pending row that cannot be reused still occupies the unique
    // `one_live_subscription_per_user` slot. Release it BEFORE creating anything at the provider,
    // otherwise ensureSubscriptionRecord fails with E11000 after a payable Razorpay subscription
    // has already been created - which is what permanently blocked checkout.
    if (existingSubscription && isReclaimableSubscription) {
      const staleProviderSubscriptionId = existingSubscription.providerSubscriptionId;

      /**
       * Ask the provider FIRST, and only then touch the local row.
       *
       * This used to release the local subscription and consult Razorpay
       * afterwards, so the "you already have one" 409 below returned with the
       * customer's row already retired: their mandate stayed live and payable at
       * Razorpay with nothing tracking it locally. findCurrentSubscription could
       * not see it, /settings showed no subscription, and the reconcilers scan by
       * live status so none of them would find it either. The customer had paid
       * for a subscription that, as far as this system was concerned, no longer
       * existed.
       *
       * Reading the provider creates nothing, so doing it before the release
       * costs nothing and removes the need to unwind a partial change at all.
       */
      let staleIsLivePaidMandate = false;
      if (staleProviderSubscriptionId) {
        try {
          const provider = await fetchRazorpaySubscription(staleProviderSubscriptionId);
          const providerStatus = String(provider.status);
          const chargeAt = provider.charge_at ? new Date(provider.charge_at * 1000) : null;

          // `active` means Razorpay has already charged at least one cycle -
          // the strongest possible proof money moved - and it was NOT protected:
          // it fell through to an immediate cancellation of a subscription the
          // customer had paid for. `authenticated` with a future charge_at is
          // the discounted case, where the addon has been captured and the first
          // full charge is booked ahead.
          staleIsLivePaidMandate =
            providerStatus === "active" ||
            (providerStatus === "authenticated" &&
              Boolean(chargeAt && chargeAt.getTime() > Date.now()));
        } catch (lookupError) {
          // Unreachable provider is not permission to destroy a mandate.
          console.error("[billing] could not verify superseded subscription before reclaim", {
            providerSubscriptionId: staleProviderSubscriptionId,
            error: lookupError instanceof Error ? lookupError.message : String(lookupError),
          });
          staleIsLivePaidMandate = true;
        }
      }

      if (staleIsLivePaidMandate) {
        // Nothing has been released, so the customer's subscription is intact.
        return NextResponse.json(
          {
            error:
              "You already have a subscription starting shortly. Refresh this page to see it.",
            code: "subscription_already_active",
          },
          { status: 409 },
        );
      }

      // Only now is the row released. It still has to happen BEFORE anything is
      // created at the provider, or ensureSubscriptionRecord fails with E11000
      // after a payable Razorpay subscription already exists - which is what
      // permanently blocked checkout.
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

      // The superseded row may hold a coupon claim. Without releasing it, the
      // customer's own retry would collide with their previous attempt and be
      // told they have already used the code.
      if (staleProviderSubscriptionId) {
        await releaseCoupon({
          subscriptionId: staleProviderSubscriptionId,
          reason: "superseded_pending_subscription",
        }).catch(() => null);
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
        // amountPaise must be what is actually CHARGED, so verify keeps
        // comparing the payment against the right number with no edit.
        pricedProduct: couponResolution?.ok
          ? { ...pricedProduct, amountPaise: couponResolution.quote.upfrontAmountPaise }
          : pricedProduct,
        pricing: snapshot.pricing,
        checkoutSource: body.source?.trim() || "billing_page",
        idempotencyKey,
        notes: {
          authType: auth.authType,
          pricingVersion: snapshot.pricingVersion,
          pricing: snapshot.pricing,
        },
      }));

    if (couponResolution?.ok) {
      // Written on the reuse path too: findPurchaseByUserAndIdempotency skips
      // createPurchaseRecord, so a row found here would otherwise carry no
      // discount fields while Razorpay charged the discounted upfront.
      purchase.originalAmountPaise = couponResolution.quote.originalAmountPaise;
      purchase.discountPaise = couponResolution.quote.discountPaise;
      purchase.couponCode = couponResolution.quote.code;
      purchase.amountPaise = couponResolution.quote.upfrontAmountPaise;
      await purchase.save();
    }

    // Reserved BEFORE the provider call. Reserving after would leave a paid,
    // discounted subscription with no record that the code was spent.
    let reservedRedemptionId: string | null = null;
    if (couponResolution?.ok) {
      const reservation = await reserveCoupon({
        couponId: couponResolution.coupon._id,
        userId: String(auth.user._id),
        purchaseId: String(purchase._id),
        code: couponResolution.quote.code,
        discountPaise: couponResolution.quote.discountPaise,
        currency: pricedProduct.currency,
      });
      if (!reservation.ok) {
        return NextResponse.json(
          {
            error: "You have already used this code.",
            code: "coupon_invalid",
            reason: reservation.reason,
          },
          { status: 409 },
        );
      }
      reservedRedemptionId = reservation.redemptionId;
    }

    let subscription;
    try {
      subscription = await createRazorpaySubscription({
        planId: providerPlanId,
        // The plan stays full price and first charges one cycle out; the addon
        // is the discounted first cycle, billed now as the authorisation
        // invoice. Razorpay auto-captures both, so the discount is never
        // refunded.
        startAt: couponResolution?.ok
          ? Math.floor(Date.now() / 1000) + cycleSeconds(product.billingCycle)
          : undefined,
        addons: couponResolution?.ok
          ? [
              {
                item: {
                  name: `First ${product.billingCycle === "monthly" ? "month" : "year"} — ${couponResolution.quote.code}`,
                  amount: couponResolution.quote.upfrontAmountPaise,
                  currency: pricedProduct.currency,
                },
              },
            ]
          : undefined,
        notes: {
          userId: String(auth.user._id),
          email: auth.user.email,
          productCode: product.code,
          purchaseId: String(purchase._id),
          pricingVersion: snapshot.pricingVersion,
          pricingTier: snapshot.pricing.tier,
          pricingCountry: snapshot.pricing.country,
          currency: pricedProduct.currency,
          ...(couponResolution?.ok ? { couponCode: couponResolution.quote.code } : {}),
        },
      });
    } catch (providerError) {
      // The claim was taken before this call, so a failure here must give it
      // back. Otherwise a provider outage permanently burns a one-per-user code
      // for a customer who was never charged.
      if (reservedRedemptionId) {
        await releaseCoupon({
          redemptionId: reservedRedemptionId,
          reason: "provider_subscription_create_failed",
        }).catch(() => null);
      }
      throw providerError;
    }

    // Attached FIRST, before any local write that can throw. Until the
    // reservation knows its subscription id, neither release filter can find
    // it - so a failure in the window below would strand the claim forever.
    if (reservedRedemptionId) {
      await attachSubscriptionToRedemption(reservedRedemptionId, subscription.id);
    }

    try {
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
          ...(couponResolution?.ok ? { couponCode: couponResolution.quote.code } : {}),
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
    } catch (localWriteError) {
      // The provider subscription now exists and is payable, but the local
      // record does not. Give the coupon back so the customer is not locked out
      // of a code they were never charged for, and let the outer handler
      // translate the error.
      if (reservedRedemptionId) {
        await releaseCoupon({
          redemptionId: reservedRedemptionId,
          reason: "local_subscription_write_failed",
        }).catch(() => null);
      }
      throw localWriteError;
    }

    await emitNotificationEvent(buildSubscriptionCheckoutStartedEvent({
      userId: String(auth.user._id),
      email: auth.user.email,
      name: auth.user.name || null,
      purchaseId: String(purchase._id),
      subscriptionId: subscription.id,
      productCode: product.code,
      amountSubunits: chargeAmountSubunits,
      currency: pricedProduct.currency,
      pricingTier: snapshot.pricing.tier,
      pricingCountry: snapshot.pricing.country,
    }));

    return NextResponse.json({
      purchaseId: String(purchase._id),
      subscriptionId: subscription.id,
      key: getRazorpayConfig().publicKeyId,
      product: pricedProduct,
      ...(couponResolution?.ok
        ? {
            coupon: {
              code: couponResolution.quote.code,
              percent: couponResolution.quote.percent,
              discountSubunits: couponResolution.quote.discountPaise,
              upfrontSubunits: couponResolution.quote.upfrontAmountPaise,
              recurringSubunits: couponResolution.quote.originalAmountPaise,
              currency: pricedProduct.currency,
            },
          }
        : {}),
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
