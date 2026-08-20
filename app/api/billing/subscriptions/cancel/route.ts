import { NextRequest, NextResponse } from "next/server";
import { cancelRazorpaySubscription, fetchRazorpaySubscription } from "@/lib/billing/razorpay";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { findCurrentSubscription, updateBillingSubscriptionState } from "@/lib/billing/db";
import {
  buildSubscriptionCancelledEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
import { billingErrorResponse } from "@/lib/billing/http-errors";
import { releaseCoupon } from "@/lib/billing/coupon";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));
    // Bridge auth too. A customer arriving from the plugin holds only the
    // bridge cookie, and checkout now renders a Cancel button for them - a
    // subscription in "scheduled", which is where every discounted one rests for
    // its whole first cycle. Without this the button was there and answered 401:
    // a subscription they could see and could not end.
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await findCurrentSubscription(String(auth.user._id));
    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json({
        ok: true,
        status: "cancelled",
        willCancelAt: subscription.currentPeriodEnd,
      });
    }

    // A paid subscription must never be revoked immediately just because a
    // webhook omitted local period dates. Refresh the provider record first
    // and use Razorpay as the source of truth for the current paid cycle.
    if (
      subscription.status !== "payment_pending" &&
      !subscription.currentPeriodEnd
    ) {
      const latest = await fetchRazorpaySubscription(subscription.providerSubscriptionId);
      subscription.currentPeriodStart =
        typeof latest.current_start === "number"
          ? new Date(latest.current_start * 1000)
          : subscription.currentPeriodStart;
      subscription.currentPeriodEnd =
        typeof latest.current_end === "number"
          ? new Date(latest.current_end * 1000)
          : subscription.currentPeriodEnd;
      subscription.nextChargeAt =
        typeof latest.charge_at === "number"
          ? new Date(latest.charge_at * 1000)
          : subscription.nextChargeAt;
      await subscription.save();
    }

    const cancelAtCycleEnd = subscription.status !== "payment_pending";

    let providerAlreadyCancelled = false;
    // Set when Razorpay refuses a cycle-end cancellation and we fall back to an
    // immediate one. Without it the local row recorded "cancel_scheduled" - "you
    // keep access until the period ends" - for a subscription that no longer
    // existed at the provider, and the coupon release below was skipped, so the
    // customer could never use their one-per-user code again.
    let cancelledImmediatelyAsFallback = false;
    try {
      await cancelRazorpaySubscription(subscription.providerSubscriptionId, cancelAtCycleEnd);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already cancel|already been cancel|subscription.*cancelled/i.test(message)) {
        providerAlreadyCancelled = true;
      } else if (!cancelAtCycleEnd || !/no billing cycle/i.test(message)) {
        throw error;
      } else {
        await cancelRazorpaySubscription(subscription.providerSubscriptionId, false);
        cancelledImmediatelyAsFallback = true;
      }
    }

    const localCancelAtCycleEnd =
      providerAlreadyCancelled || cancelledImmediatelyAsFallback ? false : cancelAtCycleEnd;
    // A cancelled pending checkout concludes no other flow: the reconciler
    // scans only payment_pending, so once this row moves to cancelled nothing
    // would ever free the coupon claim and the customer could never use the
    // code again. Only a reserved row is touched - a redeemed one represents
    // money that moved.
    if (!localCancelAtCycleEnd) {
      await releaseCoupon({
        subscriptionId: subscription.providerSubscriptionId,
        reason: "subscription_cancelled_by_user",
      }).catch((error) => {
        console.error("[billing] coupon release on cancellation failed", {
          subscriptionId: subscription.providerSubscriptionId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    subscription.status = localCancelAtCycleEnd ? "cancel_scheduled" : "cancelled";
    subscription.cancelAtCycleEnd = localCancelAtCycleEnd;
    // Stamped on the immediate path, which never recorded when the subscription
    // actually ended - leaving a cancelled row with no cancellation date.
    if (!localCancelAtCycleEnd) subscription.canceledAt = subscription.canceledAt || new Date();
    await subscription.save();

    await updateBillingSubscriptionState({
      userId: String(auth.user._id),
      planCode: subscription.planCode,
      status: localCancelAtCycleEnd ? "cancel_scheduled" : "cancelled",
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewsAt: subscription.nextChargeAt || subscription.currentPeriodEnd || null,
      cancelAtCycleEnd: localCancelAtCycleEnd,
    });

    try {
      const latest = await fetchRazorpaySubscription(subscription.providerSubscriptionId);
      subscription.currentPeriodStart =
        typeof latest.current_start === "number" ? new Date(latest.current_start * 1000) : subscription.currentPeriodStart;
      subscription.currentPeriodEnd =
        typeof latest.current_end === "number" ? new Date(latest.current_end * 1000) : subscription.currentPeriodEnd;
      subscription.nextChargeAt =
        typeof latest.charge_at === "number" ? new Date(latest.charge_at * 1000) : subscription.nextChargeAt;
      await subscription.save();
      await updateBillingSubscriptionState({
        userId: String(auth.user._id),
        planCode: subscription.planCode,
        status: localCancelAtCycleEnd ? "cancel_scheduled" : "cancelled",
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        renewsAt: subscription.nextChargeAt || subscription.currentPeriodEnd || null,
        cancelAtCycleEnd: localCancelAtCycleEnd,
      });
    } catch (error) {
      console.warn("Subscription cancellation accepted but provider refresh failed", {
        subscriptionId: subscription.providerSubscriptionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await emitNotificationEvent(buildSubscriptionCancelledEvent({
      userId: String(auth.user._id),
      email: auth.user.email,
      name: auth.user.name || null,
      subscriptionRecordId: String(subscription._id),
      providerSubscriptionId: subscription.providerSubscriptionId,
      planCode: subscription.planCode,
      status: localCancelAtCycleEnd ? "cancel_scheduled" : "cancelled",
      currentPeriodEnd: subscription.currentPeriodEnd || null,
    }));

    return NextResponse.json({
      ok: true,
      status: localCancelAtCycleEnd ? "cancel_scheduled" : "cancelled",
      willCancelAt: subscription.currentPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/cancel error:", error);
    return billingErrorResponse(error, "Unable to cancel subscription.", "subscription_cancel_failed");
  }
}
