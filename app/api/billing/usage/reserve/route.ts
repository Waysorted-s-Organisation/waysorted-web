import { NextRequest, NextResponse } from "next/server";
import { hasSubscriptionEntitlement } from "@/lib/billing/subscription-status";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, reserveCredits } from "@/lib/billing/db";
import { resolveUsageCredits } from "@/lib/billing/usagePricing";
import dbConnect from "@/lib/db";
import {
  buildBillingBlockedEvent,
  buildCreditsLowEvent,
  emitNotificationEvent,
  getLowCreditThreshold,
} from "@/lib/notifications";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ReserveBody = {
  featureCode?: string;
  toolCode?: string;
  sizeBytes?: number;
  selectedOptions?: Record<string, unknown>;
  processor?: string;
  idempotencyKey?: string;
};

type ReserveNotificationContext = {
  userId: string;
  email: string;
  name?: string | null;
  eventKey: string;
  featureCode: string;
  toolCode?: string | null;
  creditsRequired: number;
  availableCredits: number;
  heldCredits: number;
  thresholdCredits: number;
  subscriptionStatus: string;
  planCode?: string | null;
  lifetimePurchasedCredits: number;
  pricingTier?: string | null;
  loyaltyEligible: boolean;
};

export async function POST(request: NextRequest) {
  let notificationContext: ReserveNotificationContext | null = null;

  try {
    await dbConnect();
    const body = (await request.json().catch(() => ({}))) as ReserveBody;
    const auth = await getAuthenticatedUser(request);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolved = resolveUsageCredits(body);
    const snapshot = await buildBillingSnapshot(auth.user, request);
    const lowCreditThreshold = getLowCreditThreshold();
    // "scheduled" is a paid subscriber - it is where every discounted
    // subscription rests for its whole first cycle - and omitting it withheld
    // loyalty pricing from exactly the customers who had just paid.
    const loyaltyEligible =
      hasSubscriptionEntitlement(snapshot.subscription.status) ||
      snapshot.wallet.lifetimePurchasedCredits > 0;
    const reservationIdempotencyKey =
      body.idempotencyKey?.trim() ||
      `reserve:${auth.user._id}:${resolved.featureCode}:${Date.now()}`;

    notificationContext = {
      userId: String(auth.user._id),
      email: auth.user.email,
      name: auth.user.name || null,
      eventKey: reservationIdempotencyKey,
      featureCode: resolved.featureCode,
      toolCode: body.toolCode?.trim() || null,
      creditsRequired: resolved.creditsRequired,
      availableCredits: snapshot.wallet.availableCredits,
      heldCredits: snapshot.wallet.heldCredits,
      thresholdCredits: lowCreditThreshold,
      subscriptionStatus: snapshot.subscription.status,
      planCode: snapshot.subscription.planCode,
      lifetimePurchasedCredits: snapshot.wallet.lifetimePurchasedCredits,
      pricingTier: snapshot.pricing.tier,
      loyaltyEligible,
    };

    if (resolved.requiresSubscription && !snapshot.capabilities.customizablePresets) {
      await emitNotificationEvent(buildBillingBlockedEvent({
        ...notificationContext,
        reason: "subscription_required",
        checkoutTarget: "/pricing",
      }));

      return NextResponse.json(
        {
          error: "This feature requires an active subscription.",
          featureCode: resolved.featureCode,
          creditsRequired: resolved.creditsRequired,
          requiresBilling: true,
          requiresCheckout: true,
          checkoutTarget: "/pricing",
          reason: "subscription_required",
        },
        { status: 403 },
      );
    }

    if (resolved.creditsRequired === 0) {
      return NextResponse.json({
        status: "free",
        featureCode: resolved.featureCode,
        creditsReserved: 0,
      });
    }

    const { reservation, balanceAfterAction } = await reserveCredits({
      userId: String(auth.user._id),
      featureCode: resolved.featureCode,
      toolCode: body.toolCode?.trim() || null,
      sizeBucket: resolved.sizeBucket,
      creditsRequired: resolved.creditsRequired,
      processor: body.processor?.trim() || null,
      selectedOptions: body.selectedOptions || {},
      idempotencyKey: reservationIdempotencyKey,
    });

    if (balanceAfterAction <= lowCreditThreshold) {
      await emitNotificationEvent(buildCreditsLowEvent({
        ...notificationContext,
        eventKey: `reservation:${reservation._id}`,
        balanceAfterAction,
        reason: "post_reservation_low_balance",
      }));
    }

    return NextResponse.json({
      reservationId: String(reservation._id),
      status: reservation.status,
      featureCode: reservation.featureCode,
      creditsReserved: reservation.creditsReserved,
      expiresAt: reservation.expiresAt,
      processorToken: reservation.processorToken,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/reserve error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : "Unable to reserve credits.";

    if (status === 409 && /insufficient credits/i.test(message)) {
      if (notificationContext) {
        await emitNotificationEvent(buildCreditsLowEvent({
          ...notificationContext,
          balanceAfterAction: notificationContext.availableCredits,
          reason: "insufficient_credits",
        }));
      }

      return NextResponse.json(
        {
          error: message,
          requiresBilling: true,
          requiresCheckout: true,
          checkoutTarget: "/pricing",
          reason: "insufficient_credits",
        },
        { status },
      );
    }

    return billingErrorResponse(error, "Unable to reserve credits.", "reservation_create_failed");
  }
}
