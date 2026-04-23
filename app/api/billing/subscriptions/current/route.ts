import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, findCurrentSubscription } from "@/lib/billing/db";

export async function GET(request: NextRequest) {
  try {
    const bridgeToken = request.nextUrl.searchParams.get("bridge");
    const auth =
      (await getAuthenticatedUser(request)) || (await getBridgeAuthenticatedUser(bridgeToken));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscription, snapshot] = await Promise.all([
      findCurrentSubscription(String(auth.user._id)),
      buildBillingSnapshot(auth.user),
    ]);

    return NextResponse.json({
      subscription: subscription
        ? {
            id: String(subscription._id),
            providerSubscriptionId: subscription.providerSubscriptionId,
            planCode: subscription.planCode,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextChargeAt: subscription.nextChargeAt,
            cancelAtCycleEnd: subscription.cancelAtCycleEnd,
          }
        : null,
      billing: snapshot.subscription,
    });
  } catch (error) {
    console.error("GET /api/billing/subscriptions/current error:", error);
    return NextResponse.json({ error: "Unable to load subscription." }, { status: 500 });
  }
}
