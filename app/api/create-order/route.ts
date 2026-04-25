import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/payment";
import { getCurrentUser } from "@/lib/user";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { getPlanVariant, isBillingCycle, isPlanId } from "@/lib/payments/plans";
import type { BillingCycle, PlanId } from "@/types/payment";

type CreateOrderBody = {
  planId?: string;
  billing?: string;
  amount?: number;
  currency?: string;
  receipt?: string;
};

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 });
    }

    const body = (await req.json()) as CreateOrderBody;
    const hasPlanParams =
      typeof body.planId === "string" &&
      typeof body.billing === "string" &&
      isPlanId(body.planId) &&
      isBillingCycle(body.billing);

    let amountPaise = 0;
    let currency = "INR";
    let receipt = `ws-${user.id}-${Date.now()}`;
    let creditsToAdd = 0;
    let planId: PlanId | null = null;
    let billing: BillingCycle | null = null;

    if (hasPlanParams) {
      planId = body.planId as PlanId;
      billing = body.billing as BillingCycle;
      const variant = getPlanVariant(planId, billing);
      amountPaise = variant.amountPaise;
      currency = variant.currency;
      creditsToAdd = variant.creditsToAdd;
    } else {
      amountPaise = Number(body.amount || 0);
      currency = (body.currency || "INR").trim().toUpperCase();
      if (body.receipt && body.receipt.trim()) receipt = body.receipt.trim();
    }

    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise", requestId },
        { status: 400 }
      );
    }

    const order = await createRazorpayOrder({
      amountPaise,
      currency,
      receipt,
      notes: {
        userId: user.id,
        ...(planId ? { planId } : {}),
        ...(billing ? { billing } : {}),
      },
    });

    if (planId && billing) {
      await dbConnect();
      await Payment.create({
        userId: user.id,
        planId,
        billing,
        amountPaise,
        currency,
        creditsToAdd,
        status: "created",
        provider: "razorpay",
        razorpayOrderId: order.id,
        source: "pricing_page",
      });
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      orderId: order.id,
      amountPaise: order.amount,
      key_id:
        (process.env.RAZORPAY_KEY_ID || "").trim() ||
        (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim(),
      keyId:
        (process.env.RAZORPAY_KEY_ID || "").trim() ||
        (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim(),
      requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    const status = /unauthorized|authentication/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message, requestId }, { status });
  }
}
