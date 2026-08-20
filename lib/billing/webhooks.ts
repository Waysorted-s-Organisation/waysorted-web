import Purchase, { type IPurchase } from "@/models/purchase";
import { cancelRazorpaySubscription } from "@/lib/billing/razorpay";
import RazorpayEventLog from "@/models/razorpayEventLog";
import Refund from "@/models/refund";
import Subscription from "@/models/subscription";
import {
  claimRedemptionForSettledPurchase,
  COUPON_RELEASE_REASON_REFUNDED,
  releaseCoupon,
  releaseRedeemedCoupon,
} from "@/lib/billing/coupon";
import User from "@/models/user";
import {
  buildSubscriptionPurchaseCompletedEvent,
  emitNotificationEvent,
  requirePurchaseCompletionNotification,
} from "@/lib/notifications";
import {
  applyPurchaseCredits,
  applySubscriptionCycleCredits,
  createRefundRecord,
  ensureSubscriptionRecord,
  findSubscriptionByProviderId,
  recordRefundAdjustment,
  updateBillingSubscriptionState,
} from "@/lib/billing/db";
import {
  buildSubscriptionCycleKey,
  resolvePaidSubscriptionCycle,
} from "@/lib/billing/webhook-payload";
import { validateCapturedRazorpayPayment } from "@/lib/billing/payment-verification";
import { randomUUID } from "crypto";
import type { HydratedDocument } from "mongoose";
import {
  buildWebhookClaimFilter,
  buildWebhookLeaseTimes,
  WEBHOOK_PROCESSING_LEASE_MS,
  sanitizeRazorpayWebhookPayload,
} from "@/lib/billing/webhook-processing";

function toDate(epochSeconds?: number | null) {
  return typeof epochSeconds === "number" ? new Date(epochSeconds * 1000) : null;
}

function resolveSubscriptionStatus(
  eventType: string,
  entity: Record<string, unknown>,
  currentPeriodEnd: Date | null,
) {
  if (eventType === "subscription.halted") return "halted";
  if (eventType === "subscription.pending") return "payment_pending";
  if (eventType === "subscription.authenticated") {
    // For a FUTURE-DATED subscription, `authenticated` is the success state, not
    // a pending checkout: the mandate is approved and the first charge is booked
    // for `charge_at`. Mapping it to payment_pending overwrote the `active` that
    // verify had just written — updateBillingSubscriptionState is an unguarded
    // $set — and production ordering shows authenticated is processed LAST.
    //
    // The customer had paid, and was shown "Finish your pending checkout", lost
    // customizablePresets and was served standard top-up pricing instead of
    // subscriber pricing, until the next 04:00 cron promoted them.
    const chargeAt = toDate((entity as { charge_at?: number }).charge_at);
    if (chargeAt && chargeAt.getTime() > Date.now()) return "scheduled";
    return "payment_pending";
  }
  if (eventType === "subscription.activated") {
    return Boolean(entity.cancel_at_cycle_end) ? "cancel_scheduled" : "active";
  }

  if (eventType === "subscription.cancelled") {
    if (Boolean(entity.cancel_at_cycle_end) && currentPeriodEnd && currentPeriodEnd.getTime() > Date.now()) {
      return "cancel_scheduled";
    }
    return "cancelled";
  }

  return "active";
}

function getEntityId(payload: Record<string, unknown>) {
  const innerPayload = (payload.payload as Record<string, unknown> | undefined) || {};
  const paymentPayload = (innerPayload.payment as { entity?: Record<string, unknown> } | undefined)?.entity;
  return String(paymentPayload?.id || "");
}

export async function emitSubscriptionPurchaseCompleted(input: {
  userId: string;
  purchaseId?: string | null;
  subscriptionId: string;
  productCode: string;
  completionSource: string;
}) {
  const user = await User.findById(input.userId).select("email name");
  if (!user?.email) {
    console.warn("Subscription completion notification skipped", {
      reason: "user_email_not_found",
      userId: input.userId,
      subscriptionId: input.subscriptionId,
    });
    throw new Error(
      "Required subscription purchase completion notification failed: user_email_not_found",
    );
  }

  const result = await emitNotificationEvent(buildSubscriptionPurchaseCompletedEvent({
    userId: input.userId,
    email: user.email,
    name: user.name || null,
    purchaseId: input.purchaseId || null,
    subscriptionId: input.subscriptionId,
    productCode: input.productCode,
    completionSource: input.completionSource,
  }));
  return requirePurchaseCompletionNotification(result);
}

export async function recordIncomingWebhook(input: {
  eventId: string;
  eventType: string;
  signature?: string | null;
  payload: Record<string, unknown>;
}) {
  return RazorpayEventLog.findOneAndUpdate(
    { eventId: input.eventId },
    {
      $setOnInsert: {
        eventId: input.eventId,
        eventType: input.eventType,
        signature: null,
        payload: sanitizeRazorpayWebhookPayload(input.payload),
        status: "received",
      },
    },
    { upsert: true, new: true },
  );
}

export async function claimWebhookForProcessing(
  eventId: string,
  input: { now?: Date; leaseMs?: number } = {},
) {
  const now = input.now || new Date();
  const leaseMs = input.leaseMs ?? WEBHOOK_PROCESSING_LEASE_MS;
  const attemptId = randomUUID();
  const lease = buildWebhookLeaseTimes(now, leaseMs);

  return RazorpayEventLog.findOneAndUpdate(
    buildWebhookClaimFilter(eventId, now, leaseMs),
    {
      $set: {
        status: "processing",
        processedAt: null,
        errorMessage: null,
        resultReason: null,
        processingAttemptId: attemptId,
        ...lease,
      },
    },
    { new: true },
  );
}

type PurchaseDocument = HydratedDocument<IPurchase>;

/**
 * Settles a subscription purchase from a captured payment, WITHOUT granting purchase credits.
 *
 * The cycle path is the single owner of a subscription's credits. applyPurchaseCredits granting
 * here as well put one charge into two idempotency namespaces that share no guard, so a customer
 * whose invoice.paid arrived after the capture was credited twice for a single payment.
 */
async function settleSubscriptionCapture(
  purchase: PurchaseDocument,
  paymentId: string,
  isRefunded: boolean,
) {
  const providerSubscriptionId = purchase.razorpaySubscriptionId || "";

  // The money moved, so the promotional allowance is spent rather than merely held. This branch
  // never touched the redemption row at all: the customer paid at a discount, took the credits, and
  // kept a claim the orphan sweep would hand straight back - a second discount for the asking.
  //
  // Inside the refunded guard deliberately. The admin refund route drives redeemed -> released with
  // reason "first_cycle_refunded", and an unguarded late capture would flip a refunded customer's
  // allowance back to consumed.
  if (!isRefunded && purchase.couponCode) {
    await claimRedemptionForSettledPurchase({
      // Both identifiers, because neither is reliable on its own: subscriptionId is attached only
      // after the provider call in subscriptions/create, and a webhook-created row may carry no
      // purchase id.
      purchaseId: String(purchase._id),
      subscriptionId: providerSubscriptionId || null,
    }).catch((error) => {
      console.error("[billing] coupon claim on subscription capture failed", {
        purchaseId: String(purchase._id),
        subscriptionId: providerSubscriptionId || null,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  const subscription = providerSubscriptionId
    ? await findSubscriptionByProviderId(providerSubscriptionId)
    : null;
  if (!subscription || !paymentId) {
    // Settled but uncredited, and left that way on purpose: grantApplied stays false so the
    // paid-but-unfulfilled alert fires on a charge that has no local subscription to credit. The
    // cycle reconciler is the backstop once the subscription record exists.
    console.error("[billing] captured subscription payment has no local subscription to credit", {
      purchaseId: String(purchase._id),
      subscriptionId: providerSubscriptionId || null,
      paymentId: paymentId || null,
    });
    return;
  }

  await applySubscriptionCycleCredits({
    subscription,
    // Always the shared builder, never a hand-written template. verify, invoice.paid and the
    // renewal backstop have to collapse onto the ONE unique creditledgers.idempotencyKey so
    // whichever arrives second is a no-op; two keys differing by an inserted ":payment:" segment is
    // precisely what credited the first paying customer twice for a single charge.
    cycleKey: buildSubscriptionCycleKey(subscription.providerSubscriptionId, paymentId),
    paymentId,
  });

  // Record the delivery on the purchase, including when the ledger row was already present.
  //
  // The cycle path never touches this row, so grantApplied stayed false on every correctly
  // fulfilled subscription sale - and findPaidButUnfulfilledPurchases reads exactly
  // {status:"captured", grantApplied:false} as "customer paid and got nothing", which turns the
  // daily billing cron red and buries every other signal in it. /subscriptions/verify sets it for
  // this reason; the webhook must match. Conditional, so it can never re-open the grant.
  await Purchase.updateOne(
    { _id: purchase._id, grantApplied: false },
    { $set: { grantApplied: true } },
  );
}

/**
 * Hands a fully refunded customer their promotional allowance back.
 *
 * Two lookups rather than one filter: releaseRedeemedCoupon matches on purchase OR subscription,
 * never both, so a claim recorded against only the subscription is invisible to a purchase-keyed
 * call.
 *
 * The `reserved` fallback covers the row no other path can ever free again. Every claim call site
 * swallows its error, so a transient failure leaves the redemption reserved - and once the purchase
 * is refunded, sweepOrphanedReservations deliberately skips it (coupon.ts excludes refunded
 * purchases by value) and releaseRedeemedCoupon does not match it either. That row survived
 * forever, and because user_1_active_promo counts a reserved claim as live it locked a fully
 * refunded customer out of all four codes permanently.
 */
async function releaseRefundedRedemption(purchaseId: string, subscriptionId: string | null) {
  const reason = COUPON_RELEASE_REASON_REFUNDED;
  if (await releaseRedeemedCoupon({ purchaseId, reason })) return true;
  if (subscriptionId && (await releaseRedeemedCoupon({ subscriptionId, reason }))) return true;
  if (await releaseCoupon({ purchaseId, reason })) return true;
  if (subscriptionId) return releaseCoupon({ subscriptionId, reason });
  return false;
}

export async function processRazorpayWebhook(payload: Record<string, unknown>) {
  const eventType = String(payload.event || "");
  const bodyPayload = (payload.payload as Record<string, unknown> | undefined) || {};

  switch (eventType) {
    case "payment.captured":
    case "order.paid": {
      const paymentEntity = (bodyPayload.payment as { entity?: Record<string, unknown> } | undefined)?.entity;
      const orderEntity = (bodyPayload.order as { entity?: Record<string, unknown> } | undefined)?.entity;
      const orderId = String(paymentEntity?.order_id || orderEntity?.id || "");
      const paymentId = String(paymentEntity?.id || "");

      // A SUBSCRIPTION payment carries subscription_id and invoice_id, not an
      // order. Matching only on order id/receipt could never find its purchase
      // row - every subscription purchase has razorpayOrderId null - so the
      // day-0 addon payment was unmatchable and its money went unrecorded.
      const subscriptionId = String(paymentEntity?.subscription_id || "");
      const invoiceId = String(paymentEntity?.invoice_id || "");

      if (!orderId && !subscriptionId) {
        return { ignored: true, reason: "missing_order_id" };
      }

      const purchase = orderId
        ? await Purchase.findOne({
            $or: [{ razorpayOrderId: orderId }, { receipt: String(orderEntity?.receipt || "") }],
          })
        : null;

      const subscriptionPurchase =
        purchase ||
        (subscriptionId
          ? await Purchase.findOne({
              razorpaySubscriptionId: subscriptionId,
              // "captured" with grantApplied false is included so this branch is
              // RE-ENTRANT. The row is marked captured before the grant runs, so
              // if the grant threw - a transient database error, a provider
              // timeout - Razorpay's retry could no longer match its own
              // purchase and the customer was left paid, uncredited, and
              // unreachable by this path forever.
              $or: [
                { status: { $in: ["created", "pending"] } },
                { status: "captured", grantApplied: false },
              ],
            })
          : null);

      // Whether the row was found BY order id, which is the only case where an
      // order id may be enforced against it.
      const matchedByOrderId = Boolean(purchase);

      if (!subscriptionPurchase) {
        // Terminal, not retryable, when this is a subscription payment we have
        // no local row for. `purchase_not_found` is in RETRYABLE_IGNORED_REASONS
        // (webhook-processing.ts:3), so returning it here made Razorpay retry a
        // permanently unmatchable event for ~24h and 503 the endpoint twice per
        // sale - risking deactivation of the endpoint that also carries
        // cancellations and renewals.
        if (subscriptionId) {
          console.warn("[billing] subscription payment with no local purchase", {
            subscriptionId,
            invoiceId,
            paymentId,
          });
          return { ignored: true, reason: "subscription_purchase_not_tracked" };
        }
        return { ignored: true, reason: "purchase_not_found" };
      }

      const matchedPurchase = subscriptionPurchase!;

      // Validate the payment the same way /checkout/verify does. Without this the webhook - the
      // path that runs when the customer's browser is gone, i.e. the one actually depended on -
      // grants the full credit allocation for a partial capture, or for an amount or currency that
      // does not match what was ordered.
      if (paymentEntity) {
        try {
          validateCapturedRazorpayPayment({
            payment: paymentEntity,
            purchase: matchedPurchase,
            // Enforced ONLY when the purchase was matched by order id.
            //
            // A subscription purchase has razorpayOrderId null, but Razorpay's
            // subscription invoices do carry an order_id on the payment - so
            // when one arrived, this compared that order id against the
            // purchase's null and threw "Payment order does not match the
            // purchase". The event was dropped as payment_validation_failed and
            // the customer never settled: paid, uncredited, no receipt. The
            // amount, currency, status and payment-identity checks below still
            // apply in full, so nothing about what was actually charged is
            // relaxed.
            expectedOrderId: matchedByOrderId ? orderId || null : null,
            expectedPaymentId: paymentId || null,
          });
        } catch (validationError) {
          console.error("[billing] webhook payment failed validation; not granting credits", {
            purchaseId: String(matchedPurchase._id),
            orderId,
            paymentId,
            error:
              validationError instanceof Error ? validationError.message : String(validationError),
          });
          return { ignored: true, reason: "payment_validation_failed" };
        }
      }

      // Only ever a real order id.
      //
      // `orderId` is `String(payment.order_id || order.id || "")`, and a
      // SUBSCRIPTION payment carries neither - it is identified by
      // subscription_id and invoice_id - so this resolved to "". A subscription
      // purchase legitimately has razorpayOrderId null, so `||=` assigned the
      // empty string, and the partial unique index on razorpayOrderId covers
      // `{$type: "string"}` - which "" satisfies. The first subscription to
      // settle would take "", and every one after it would fail the index with
      // E11000, throw out of the webhook, and be retried by Razorpay forever
      // without ever settling. One customer's sale would silently poison the
      // next.
      if (orderId) matchedPurchase.razorpayOrderId ||= orderId;
      matchedPurchase.razorpayPaymentId ||= paymentId || null;
      // Never resurrect a refunded purchase: a late or re-delivered capture event would otherwise
      // flip it back to captured and show a refunded charge as paid.
      const isRefunded =
        matchedPurchase.status === "refunded" || matchedPurchase.status === "partially_refunded";
      if (!isRefunded) {
        matchedPurchase.status = "captured";
        matchedPurchase.capturedAt ||= new Date();
      }
      await matchedPurchase.save();

      if (matchedPurchase.kind === "subscription") {
        // A subscription's credits belong to the CYCLE path and nothing else.
        //
        // createPurchaseRecord copies creditsGranted onto subscription rows too, so
        // applyPurchaseCredits granted here under purchase-grant:<id> while invoice.paid granted the
        // SAME charge under subscription-cycle:<subId>:...:payment:<paymentId>. Two disjoint
        // idempotency namespaces with no shared guard: a UPI AutoPay customer, whose
        // /subscriptions/verify returns 202 payment_processing and leaves grantApplied false, was
        // credited twice for one payment once both events landed.
        await settleSubscriptionCapture(matchedPurchase, paymentId, isRefunded);
      } else {
        await applyPurchaseCredits(matchedPurchase);
      }

      if (matchedPurchase.kind === "subscription" && matchedPurchase.razorpaySubscriptionId) {
        await emitSubscriptionPurchaseCompleted({
          userId: String(matchedPurchase.user),
          purchaseId: String(matchedPurchase._id),
          subscriptionId: matchedPurchase.razorpaySubscriptionId,
          productCode: matchedPurchase.productCode,
          completionSource: eventType,
        });
      }
      return { processed: true, type: eventType, purchaseId: String(matchedPurchase._id) };
    }

    case "subscription.authenticated":
    case "subscription.activated":
    case "subscription.pending":
    case "subscription.halted":
    case "subscription.cancelled": {
      const entity = (bodyPayload.subscription as { entity?: Record<string, unknown> } | undefined)?.entity;
      if (!entity?.id) return { ignored: true, reason: "missing_subscription_entity" };

      const entityNotes = (entity.notes as Record<string, unknown> | undefined) || {};
      const planCode = String(entityNotes.productCode || entityNotes.planCode || "");
      const userId = String(entityNotes.userId || "");
      if (!userId || !planCode) {
        return { ignored: true, reason: "missing_subscription_notes" };
      }

      const subscription = await ensureSubscriptionRecord({
        userId,
        planCode,
        providerPlanId: String(entity.plan_id || ""),
        providerSubscriptionId: String(entity.id),
        metadata: { source: "webhook" },
      });

      // ONLY the two endings. This block also handles authenticated, activated
      // and pending, and `subscription.authenticated` is precisely the SUCCESS
      // event for a coupon subscription - it is future-dated, so it rests in
      // authenticated for its whole first cycle. Releasing there returned a paid
      // customer's claim to the pool: the per-user cap became void, the global
      // cap under-counted, and the discount became repeatable indefinitely.
      // redeemCoupon only transitions a `reserved` row, so once released the
      // later redemption is a permanent no-op and nothing corrects it.
      if (eventType === "subscription.halted" || eventType === "subscription.cancelled") {
        await releaseCoupon({
          subscriptionId: String(entity.id),
          reason: `subscription_${eventType.split(".")[1]}`,
        }).catch((error) => {
          console.error("[billing] coupon release on subscription end failed", {
            subscriptionId: String(entity.id),
            eventType,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }

      const providerPeriodStart = toDate((entity as { current_start?: number }).current_start);
      const providerPeriodEnd = toDate((entity as { current_end?: number }).current_end);
      const providerNextChargeAt = toDate((entity as { charge_at?: number }).charge_at);
      if (providerPeriodStart) subscription.currentPeriodStart = providerPeriodStart;
      if (providerPeriodEnd) subscription.currentPeriodEnd = providerPeriodEnd;
      if (providerNextChargeAt) subscription.nextChargeAt = providerNextChargeAt;
      subscription.cancelAtCycleEnd = Boolean(entity.cancel_at_cycle_end);
      subscription.status = resolveSubscriptionStatus(
        eventType,
        entity,
        subscription.currentPeriodEnd || null,
      );
      subscription.canceledAt =
        subscription.status === "cancelled" ? new Date() : subscription.canceledAt || null;
      await subscription.save();

      await updateBillingSubscriptionState({
        userId: String(subscription.user),
        planCode: subscription.planCode,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        renewsAt: subscription.nextChargeAt || subscription.currentPeriodEnd || null,
        cancelAtCycleEnd: subscription.cancelAtCycleEnd,
      });

      if (subscription.status === "active" || subscription.status === "cancel_scheduled") {
        await emitSubscriptionPurchaseCompleted({
          userId: String(subscription.user),
          purchaseId: String(entityNotes.purchaseId || "") || null,
          subscriptionId: subscription.providerSubscriptionId,
          productCode: subscription.planCode,
          completionSource: eventType,
        });
      }

      return { processed: true, type: eventType, subscriptionId: String(subscription._id) };
    }

    case "invoice.paid":
    case "subscription.charged": {
      const paidCycle = resolvePaidSubscriptionCycle(bodyPayload);
      const subscriptionId = paidCycle.subscriptionId;
      if (!subscriptionId) return { ignored: true, reason: "missing_subscription_id" };

      const subscription = await Subscription.findOne({
        providerSubscriptionId: subscriptionId,
      });
      if (!subscription) return { ignored: true, reason: "subscription_not_found" };

      const linkedPurchaseId = String(
        (subscription.metadata as Record<string, unknown> | undefined)?.purchaseId || "",
      );

      // A charge on a discounted subscription means the first cycle was paid, so the claim is spent.
      //
      // Through the shared claim point rather than redeemCoupon: this is the third proof that the
      // money moved, and all three now converge on one helper with one tolerance. redeemCoupon
      // transitions a `reserved` row only, so a claim the orphan sweep had already released stayed
      // released for a customer who had been charged - and the code became repeatable. Keyed on the
      // purchase as well as the subscription, because subscriptionId is attached only after the
      // provider call in subscriptions/create and can legitimately be null here.
      await claimRedemptionForSettledPurchase({
        purchaseId: linkedPurchaseId || null,
        subscriptionId,
      }).catch((error) => {
        console.error("[billing] coupon claim on subscription.charged failed", {
          subscriptionId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      subscription.status = subscription.cancelAtCycleEnd ? "cancel_scheduled" : "active";
      subscription.currentPeriodStart =
        paidCycle.currentPeriodStart || subscription.currentPeriodStart || null;
      subscription.currentPeriodEnd =
        paidCycle.currentPeriodEnd || subscription.currentPeriodEnd || null;
      subscription.nextChargeAt =
        paidCycle.nextChargeAt || subscription.nextChargeAt || subscription.currentPeriodEnd || null;
      await subscription.save();

      await updateBillingSubscriptionState({
        userId: String(subscription.user),
        planCode: subscription.planCode,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        renewsAt: subscription.nextChargeAt || null,
        cancelAtCycleEnd: subscription.cancelAtCycleEnd,
      });

      const cycleIdentity = paidCycle.cycleIdentity;
      if (!cycleIdentity) {
        return { ignored: true, reason: "missing_cycle_identity" };
      }

      const cycleKey = [subscription.providerSubscriptionId, cycleIdentity].join(":");

      await applySubscriptionCycleCredits({
        subscription,
        cycleKey,
        paymentId: paidCycle.paymentId,
      });

      await emitSubscriptionPurchaseCompleted({
        userId: String(subscription.user),
        purchaseId: linkedPurchaseId || null,
        subscriptionId: subscription.providerSubscriptionId,
        productCode: subscription.planCode,
        completionSource: eventType,
      });

      return { processed: true, type: eventType, subscriptionId: String(subscription._id) };
    }

    case "invoice.payment_failed": {
      const invoiceEntity = (bodyPayload.invoice as { entity?: Record<string, unknown> } | undefined)?.entity;
      const subscriptionId = String(invoiceEntity?.subscription_id || "");
      if (!subscriptionId) return { ignored: true, reason: "missing_subscription_id" };

      const subscription = await Subscription.findOne({
        providerSubscriptionId: subscriptionId,
      });
      if (!subscription) return { ignored: true, reason: "subscription_not_found" };

      subscription.status = "halted";
      await subscription.save();
      await updateBillingSubscriptionState({
        userId: String(subscription.user),
        planCode: subscription.planCode,
        status: "halted",
        renewsAt: subscription.nextChargeAt || subscription.currentPeriodEnd || null,
      });

      return { processed: true, type: eventType, subscriptionId: String(subscription._id) };
    }

    case "refund.processed":
    case "payment.refunded": {
      const refundEntity = (bodyPayload.refund as { entity?: Record<string, unknown> } | undefined)?.entity;
      const providerRefundId = String(refundEntity?.id || "");
      const refundAmount = Number(refundEntity?.amount);
      if (!providerRefundId || !Number.isFinite(refundAmount) || refundAmount <= 0) {
        return { ignored: true, reason: "missing_refund_entity" };
      }
      const paymentId = String(refundEntity?.payment_id || getEntityId(payload));
      if (!paymentId) return { ignored: true, reason: "missing_payment_id" };

      const purchase = await Purchase.findOne({ razorpayPaymentId: paymentId });
      if (!purchase) return { ignored: true, reason: "purchase_not_found" };

      let refund = await Refund.findOne({ providerRefundId });
      if (!refund) {
        refund = await createRefundRecord({
          purchase,
          amountPaise: refundAmount,
          paymentId,
          providerRefundId,
          reason: String(((refundEntity?.notes as Record<string, unknown> | undefined) || {}).reason || ""),
        });
      }

      if (!refund.creditAdjustmentApplied) {
        await recordRefundAdjustment({
          purchase,
          amountPaise: refund.amountPaise,
          refundId: String(refund._id),
        });
        refund.creditAdjustmentApplied = true;
        refund.status = "processed";
        await refund.save();
      }

      const updatedPurchase = await Purchase.findById(purchase._id);
      if (!updatedPurchase) throw new Error("Purchase not found after refund adjustment.");
      updatedPurchase.status =
        updatedPurchase.refundedAmountPaise >= updatedPurchase.amountPaise
          ? "refunded"
          : "partially_refunded";
      updatedPurchase.refundedAt = new Date();
      await updatedPurchase.save();

      /**
       * A refunded subscription must also stop being able to charge.
       *
       * The admin refund route cancels the mandate on a full refund; this path
       * did not. A refund issued from the RAZORPAY DASHBOARD - which is how a
       * support refund actually happens - therefore reversed the money and left
       * the mandate live. At the start date Razorpay would debit the FULL plan
       * price from a customer who had been refunded in full, with no purchase
       * row to record it, and applySubscriptionCycleCredits would re-grant the
       * credits and force the subscription back to active.
       *
       * Failures are logged and swallowed: the refund itself has already been
       * issued, and a throw here would have Razorpay retry an event that has
       * already reversed credits. An uncancelled mandate is what the reconciler
       * exists to catch.
       */
      if (
        updatedPurchase.status === "refunded" &&
        updatedPurchase.kind === "subscription" &&
        updatedPurchase.razorpaySubscriptionId
      ) {
        const providerSubscriptionId = updatedPurchase.razorpaySubscriptionId;
        try {
          await cancelRazorpaySubscription(providerSubscriptionId, false);
        } catch (cancelError) {
          console.error("[billing] could not cancel a refunded subscription from the webhook", {
            purchaseId: String(updatedPurchase._id),
            subscriptionId: providerSubscriptionId,
            error: cancelError instanceof Error ? cancelError.message : String(cancelError),
          });
        }
        await Subscription.updateOne(
          { providerSubscriptionId },
          { $set: { status: "cancelled", canceledAt: new Date() } },
        ).catch(() => null);
        await updateBillingSubscriptionState({
          userId: String(updatedPurchase.user),
          planCode: updatedPurchase.productCode,
          status: "cancelled",
          renewsAt: null,
          cancelAtCycleEnd: false,
        }).catch(() => null);
      }

      // Give the promotional allowance back on a FULL refund, the way the admin refund route
      // already does. This path did not, so a refund issued from the Razorpay dashboard left the
      // redemption "redeemed" - and because user_1_active_promo is deliberately not scoped per
      // coupon, that locked the customer out of ALL FOUR codes for a subscription whose money they
      // got back in full. A partial refund is not that: the customer keeps the discounted product.
      if (updatedPurchase.status === "refunded" && updatedPurchase.couponCode) {
        // Never allowed to fail the refund webhook. A throw here would have Razorpay retry an event
        // that has already reversed the credits, purely over coupon bookkeeping.
        await releaseRefundedRedemption(
          String(updatedPurchase._id),
          updatedPurchase.razorpaySubscriptionId || null,
        ).catch((error) => {
          console.error("[billing] coupon release on refund webhook failed", {
            purchaseId: String(updatedPurchase._id),
            providerRefundId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }

      return { processed: true, type: eventType, refundId: String(refund._id) };
    }

    default:
      return { ignored: true, reason: "unhandled_event", eventType };
  }
}
