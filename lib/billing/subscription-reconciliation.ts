import Purchase from "@/models/purchase";
import Subscription from "@/models/subscription";
import { updateBillingSubscriptionState } from "@/lib/billing/db";
import { fetchRazorpaySubscription } from "@/lib/billing/razorpay";
import { cancelRazorpaySubscription } from "@/lib/billing/razorpay";
import dbConnect from "@/lib/db";

const DEFAULT_MINIMUM_AGE_MS = 2 * 60 * 60_000;
/**
 * Grace period before an active subscription past its local period end is even considered lapsed.
 *
 * Razorpay retries renewal webhooks for up to 24h and UPI AutoPay debits can be deferred, so a
 * customer who is still being charged must not lose access because a message was slow.
 */
const LAPSED_GRACE_MS = 72 * 60 * 60_000;

function epochDate(value?: number) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

export async function reconcileStalePendingSubscriptions(input: {
  minimumAgeMs?: number;
  limit?: number;
} = {}) {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();
  const cutoff = new Date(Date.now() - (input.minimumAgeMs ?? DEFAULT_MINIMUM_AGE_MS));
  const subscriptions = await Subscription.find({
    status: "payment_pending",
    updatedAt: { $lte: cutoff },
  }).sort({ updatedAt: 1 }).limit(Math.max(1, Math.min(input.limit ?? 25, 100)));
  const summary = { scanned: subscriptions.length, activated: 0, expired: 0, pending: 0, failed: 0 };

  for (const subscription of subscriptions) {
    try {
      const provider = await fetchRazorpaySubscription(subscription.providerSubscriptionId);
      if (provider.status === "active") {
        subscription.status = "active";
        subscription.currentPeriodStart = epochDate(provider.current_start);
        subscription.currentPeriodEnd = epochDate(provider.current_end);
        subscription.nextChargeAt = epochDate(provider.charge_at);
        await subscription.save();
        await updateBillingSubscriptionState({
          userId: String(subscription.user),
          planCode: subscription.planCode,
          status: "active",
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          renewsAt: subscription.nextChargeAt || subscription.currentPeriodEnd || null,
          cancelAtCycleEnd: false,
        });
        summary.activated += 1;
      } else if (["expired", "cancelled"].includes(provider.status)) {
        subscription.status = provider.status === "cancelled" ? "cancelled" : "expired";
        subscription.canceledAt ||= new Date();
        await subscription.save();
        await Purchase.updateMany(
          { razorpaySubscriptionId: subscription.providerSubscriptionId, status: "pending" },
          { $set: { status: "failed" } },
        );
        await updateBillingSubscriptionState({
          userId: String(subscription.user),
          planCode: subscription.planCode,
          status: subscription.status,
          renewsAt: null,
          cancelAtCycleEnd: false,
        });
        summary.expired += 1;
      } else if (["created", "pending", "authenticated"].includes(provider.status)) {
        const confirmedPurchase = await Purchase.exists({
          razorpaySubscriptionId: subscription.providerSubscriptionId,
          status: "captured",
          "notes.clientSubscriptionConfirmation": { $exists: true },
        });
        if (confirmedPurchase) {
          summary.pending += 1;
          continue;
        }
        await cancelRazorpaySubscription(subscription.providerSubscriptionId, false).catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          if (!/already|cancel|expired/i.test(message)) throw error;
        });
        subscription.status = "expired";
        subscription.canceledAt ||= new Date();
        await subscription.save();
        await Purchase.updateMany(
          { razorpaySubscriptionId: subscription.providerSubscriptionId, status: "pending" },
          { $set: { status: "failed" } },
        );
        await updateBillingSubscriptionState({
          userId: String(subscription.user),
          planCode: subscription.planCode,
          status: "expired",
          renewsAt: null,
          cancelAtCycleEnd: false,
        });
        summary.expired += 1;
      } else {
        summary.pending += 1;
      }
    } catch (error) {
      summary.failed += 1;
      console.error("Pending subscription reconciliation failed", {
        subscriptionId: String(subscription._id),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Expiring an active subscription revokes a paying customer's access, so it must never be done
  // on local dates alone. A renewal webhook that is merely LATE - Razorpay retries for up to 24h,
  // and UPI AutoPay debits are routinely deferred - would otherwise cut off someone who is still
  // being charged. Confirm with the provider first, and only after a grace period.
  const lapsedCutoff = new Date(Date.now() - LAPSED_GRACE_MS);
  const lapsed = await Subscription.find({
    status: { $in: ["active", "cancel_scheduled"] },
    currentPeriodEnd: { $lt: lapsedCutoff },
  }).limit(Math.max(1, Math.min(input.limit ?? 25, 100)));

  for (const subscription of lapsed) {
    try {
      const provider = subscription.providerSubscriptionId
        ? await fetchRazorpaySubscription(subscription.providerSubscriptionId)
        : null;
      const providerStatus = String(provider?.status || "").toLowerCase();

      // Still live at the provider: the local period end is stale, not the subscription. Adopt the
      // provider's dates instead of revoking access.
      if (["active", "authenticated", "pending"].includes(providerStatus)) {
        const nextPeriodEnd = epochDate(provider?.current_end as number | undefined);
        if (nextPeriodEnd) {
          subscription.currentPeriodEnd = nextPeriodEnd;
          await subscription.save();
        }
        summary.pending += 1;
        continue;
      }

      subscription.status = "expired";
      await subscription.save();
      await updateBillingSubscriptionState({
        userId: String(subscription.user),
        planCode: subscription.planCode,
        status: "expired",
        renewsAt: null,
        cancelAtCycleEnd: false,
      });
      summary.expired += 1;
    } catch (error) {
      // Could not confirm with the provider - leave the customer's access intact and retry later.
      summary.failed += 1;
      console.error("[billing] lapsed subscription check failed; access left untouched", {
        subscriptionId: String(subscription._id),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}
