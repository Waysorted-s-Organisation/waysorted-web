import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, findCurrentSubscription } from "@/lib/billing/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const auth =
      (await getAuthenticatedUser(request)) || (await getBridgeAuthenticatedUser("billing:read"));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscription, snapshot] = await Promise.all([
      findCurrentSubscription(String(auth.user._id)),
      buildBillingSnapshot(auth.user, request),
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
