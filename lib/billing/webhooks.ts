import Purchase from "@/models/purchase";
import RazorpayEventLog from "@/models/razorpayEventLog";
import Refund from "@/models/refund";
import Subscription from "@/models/subscription";
import { redeemCoupon, releaseCoupon } from "@/lib/billing/coupon";
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
  recordRefundAdjustment,
  updateBillingSubscriptionState,
} from "@/lib/billing/db";
import { resolvePaidSubscriptionCycle } from "@/lib/billing/webhook-payload";
import { validateCapturedRazorpayPayment } from "@/lib/billing/payment-verification";
import { randomUUID } from "crypto";
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
  if (eventType === "subscription.authenticated") return "payment_pending";
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

      if (!orderId) return { ignored: true, reason: "missing_order_id" };

      const purchase = await Purchase.findOne({
        $or: [{ razorpayOrderId: orderId }, { receipt: String(orderEntity?.receipt || "") }],
      });

      if (!purchase) return { ignored: true, reason: "purchase_not_found" };

      // Validate the payment the same way /checkout/verify does. Without this the webhook - the
      // path that runs when the customer's browser is gone, i.e. the one actually depended on -
      // grants the full credit allocation for a partial capture, or for an amount or currency that
      // does not match what was ordered.
      if (paymentEntity) {
        try {
          validateCapturedRazorpayPayment({
            payment: paymentEntity,
            purchase,
            expectedOrderId: orderId,
            expectedPaymentId: paymentId || null,
          });
        } catch (validationError) {
          console.error("[billing] webhook payment failed validation; not granting credits", {
            purchaseId: String(purchase._id),
            orderId,
            paymentId,
            error:
              validationError instanceof Error ? validationError.message : String(validationError),
          });
          return { ignored: true, reason: "payment_validation_failed" };
        }
      }

      purchase.razorpayOrderId ||= orderId;
      purchase.razorpayPaymentId ||= paymentId || null;
      // Never resurrect a refunded purchase: a late or re-delivered capture event would otherwise
      // flip it back to captured and show a refunded charge as paid.
      if (purchase.status !== "refunded" && purchase.status !== "partially_refunded") {
        purchase.status = "captured";
        purchase.capturedAt ||= new Date();
      }
      await purchase.save();

      await applyPurchaseCredits(purchase);
      if (purchase.kind === "subscription" && purchase.razorpaySubscriptionId) {
        await emitSubscriptionPurchaseCompleted({
          userId: String(purchase.user),
          purchaseId: String(purchase._id),
          subscriptionId: purchase.razorpaySubscriptionId,
          productCode: purchase.productCode,
          completionSource: eventType,
        });
      }
      return { processed: true, type: eventType, purchaseId: String(purchase._id) };
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

      // A charge on a discounted subscription means the first cycle was paid,
      // so the claim is spent. Idempotent: only a reserved row transitions, and
      // verify may already have done it.
      await redeemCoupon({ subscriptionId }).catch((error) => {
        console.error("[billing] coupon redemption on subscription.charged failed", {
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

      const purchaseId = String(
        (subscription.metadata as Record<string, unknown> | undefined)
          ?.purchaseId || "",
      );
      await emitSubscriptionPurchaseCompleted({
        userId: String(subscription.user),
        purchaseId: purchaseId || null,
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

      return { processed: true, type: eventType, refundId: String(refund._id) };
    }

    default:
      return { ignored: true, reason: "unhandled_event", eventType };
  }
}
