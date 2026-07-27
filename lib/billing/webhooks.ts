import Purchase from "@/models/purchase";
import RazorpayEventLog from "@/models/razorpayEventLog";
import Refund from "@/models/refund";
import Subscription from "@/models/subscription";
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
  if (eventType === "subscription.authenticated" || eventType === "subscription.activated") {
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
        signature: input.signature || null,
        payload: input.payload,
        status: "received",
      },
    },
    { upsert: true, new: true },
  );
}

export async function claimWebhookForProcessing(eventId: string) {
  return RazorpayEventLog.findOneAndUpdate(
    {
      eventId,
      status: { $in: ["received", "failed"] },
    },
    {
      $set: {
        status: "processing",
        processedAt: null,
        errorMessage: null,
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

      purchase.razorpayOrderId ||= orderId;
      purchase.razorpayPaymentId ||= paymentId || null;
      purchase.status = "captured";
      purchase.capturedAt ||= new Date();
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

      subscription.currentPeriodStart = toDate((entity as { current_start?: number }).current_start);
      subscription.currentPeriodEnd = toDate((entity as { current_end?: number }).current_end);
      subscription.nextChargeAt = toDate((entity as { charge_at?: number }).charge_at);
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
      const invoiceEntity = (bodyPayload.invoice as { entity?: Record<string, unknown> } | undefined)?.entity;
      const subscriptionId = String(
        invoiceEntity?.subscription_id ||
          (bodyPayload.subscription as { entity?: Record<string, unknown> } | undefined)?.entity?.id ||
          "",
      );
      if (!subscriptionId) return { ignored: true, reason: "missing_subscription_id" };

      const subscription = await Subscription.findOne({
        providerSubscriptionId: subscriptionId,
      });
      if (!subscription) return { ignored: true, reason: "subscription_not_found" };

      subscription.status = subscription.cancelAtCycleEnd ? "cancel_scheduled" : "active";
      subscription.currentPeriodStart = toDate((invoiceEntity as { period_start?: number }).period_start);
      subscription.currentPeriodEnd = toDate((invoiceEntity as { period_end?: number }).period_end);
      subscription.nextChargeAt = subscription.currentPeriodEnd;
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

      const cycleIdentity =
        String(invoiceEntity?.id || "") ||
        [invoiceEntity?.period_start || "", invoiceEntity?.period_end || ""].filter(Boolean).join(":") ||
        String(invoiceEntity?.payment_id || "");
      if (!cycleIdentity) {
        return { ignored: true, reason: "missing_cycle_identity" };
      }

      const cycleKey = [subscription.providerSubscriptionId, cycleIdentity].join(":");

      await applySubscriptionCycleCredits({
        subscription,
        cycleKey,
        paymentId: String(invoiceEntity?.payment_id || ""),
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
      const paymentId = String(refundEntity?.payment_id || getEntityId(payload));
      if (!paymentId) return { ignored: true, reason: "missing_payment_id" };

      const purchase = await Purchase.findOne({ razorpayPaymentId: paymentId });
      if (!purchase) return { ignored: true, reason: "purchase_not_found" };

      let refund = await Refund.findOne({ providerRefundId: String(refundEntity?.id || "") });
      if (!refund) {
        refund = await createRefundRecord({
          purchase,
          amountPaise: Number(refundEntity?.amount || purchase.amountPaise),
          paymentId,
          providerRefundId: String(refundEntity?.id || ""),
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

      purchase.status =
        refund.amountPaise >= purchase.amountPaise ? "refunded" : "partially_refunded";
      purchase.refundedAt = new Date();
      await purchase.save();

      return { processed: true, type: eventType, refundId: String(refund._id) };
    }

    default:
      return { ignored: true, reason: "unhandled_event", eventType };
  }
}
