import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/payment";
import { getCurrentUser } from "@/lib/user";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import {
  getPlanVariant,
  isBillingCycle,
  isPlanId,
  PLAN_CATALOG,
} from "@/lib/payments/plans";
import type { PaymentOrderRequest, PaymentOrderResponse } from "@/types/payment";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Partial<PaymentOrderRequest>;
    const planIdRaw = body.planId;
    const billingRaw = body.billing;

    if (!planIdRaw || !billingRaw || !isPlanId(planIdRaw) || !isBillingCycle(billingRaw)) {
      return NextResponse.json(
        { error: "Invalid plan or billing cycle", requestId },
        { status: 400 }
      );
    }

    const planId = planIdRaw;
    const billing = billingRaw;
    const variant = getPlanVariant(planId, billing);
    const plan = PLAN_CATALOG[planId];
    const receipt = `ws-${user.id}-${Date.now()}`;

    const razorpayOrder = await createRazorpayOrder({
      amountPaise: variant.amountPaise,
      currency: variant.currency,
      receipt,
      notes: {
        userId: user.id,
        planId,
        billing,
      },
    });

    await dbConnect();
    await Payment.create({
      userId: user.id,
      planId,
      billing,
      amountPaise: variant.amountPaise,
      currency: variant.currency,
      creditsToAdd: variant.creditsToAdd,
      status: "created",
      provider: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      source: "pricing_page",
    });

    const response: PaymentOrderResponse = {
      orderId: razorpayOrder.id,
      amountPaise: variant.amountPaise,
      currency: variant.currency,
      planId,
      billing,
      creditsToAdd: variant.creditsToAdd,
      keyId:
        (process.env.RAZORPAY_KEY_ID || "").trim() ||
        (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim(),
    };

    if (!response.keyId) {
      return NextResponse.json(
        { error: "Payment key not configured", requestId },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ...response,
      planName: plan.name,
      requestId,
    });
  } catch (error) {
    console.error("POST /api/payments/order error", { requestId, error });
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Failed to create payment order";
    return NextResponse.json(
      { error: errorMessage, requestId },
      { status: 500 }
    );
  }
}
