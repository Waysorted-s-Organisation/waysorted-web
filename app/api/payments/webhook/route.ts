import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/payment";
import User from "@/models/user";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        error_code?: string;
        error_description?: string;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const signature = req.headers.get("x-razorpay-signature") || "";
    const rawBody = await req.text();

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature", requestId },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const event = payload.event;
    const entity = payload.payload?.payment?.entity;

    if (!entity?.order_id) {
      return NextResponse.json({ ok: true, ignored: true, requestId });
    }

    await dbConnect();

    if (event === "payment.captured") {
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
      if (!payment) {
        return NextResponse.json({ ok: true, ignored: true, requestId });
      }

      const capturedPayment = await Payment.findOneAndUpdate(
        { _id: payment._id, status: { $ne: "captured" } },
        {
          $set: {
            status: "captured",
            razorpayPaymentId: entity.id,
          },
        },
        { new: true }
      );

      if (capturedPayment) {
        await User.findByIdAndUpdate(capturedPayment.userId, {
          $inc: { creditsRemaining: capturedPayment.creditsToAdd },
        });
      }

      return NextResponse.json({ ok: true, requestId });
    }

    if (event === "payment.failed") {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id, status: { $ne: "captured" } },
        {
          $set: {
            status: "failed",
            razorpayPaymentId: entity.id,
            failureCode: entity.error_code || "payment_failed",
            failureReason: entity.error_description || "Payment failed at gateway",
          },
        }
      );
      return NextResponse.json({ ok: true, requestId });
    }

    return NextResponse.json({ ok: true, ignored: true, requestId });
  } catch (error) {
    console.error("POST /api/payments/webhook error", { requestId, error });
    return NextResponse.json(
      { error: "Webhook processing failed", requestId },
      { status: 500 }
    );
  }
}
