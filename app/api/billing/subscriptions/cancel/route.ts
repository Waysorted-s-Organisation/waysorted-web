import { NextRequest, NextResponse } from "next/server";
import { cancelRazorpaySubscription, fetchRazorpaySubscription } from "@/lib/billing/razorpay";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { findCurrentSubscription, updateBillingSubscriptionState } from "@/lib/billing/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { bridgeToken?: string };
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

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

    await cancelRazorpaySubscription(subscription.providerSubscriptionId);
    const latest = await fetchRazorpaySubscription(subscription.providerSubscriptionId);

    subscription.status = "cancel_scheduled";
    subscription.cancelAtCycleEnd = true;
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
      status: "cancel_scheduled",
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewsAt: subscription.nextChargeAt || subscription.currentPeriodEnd || null,
      cancelAtCycleEnd: true,
    });

    return NextResponse.json({
      ok: true,
      status: "cancel_scheduled",
      willCancelAt: subscription.currentPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/cancel error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to cancel subscription." },
      { status },
    );
  }
}
