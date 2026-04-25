import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/payment";
import User from "@/models/user";
import { getCurrentUser } from "@/lib/user";
import { verifyRazorpayCheckoutSignature } from "@/lib/payments/razorpay";
import type { PaymentVerifyRequest, PaymentVerifyResponse } from "@/types/payment";

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

    const body = (await req.json()) as Partial<PaymentVerifyRequest>;
    const razorpayOrderId = body.razorpayOrderId?.trim();
    const razorpayPaymentId = body.razorpayPaymentId?.trim();
    const razorpaySignature = body.razorpaySignature?.trim();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing verification payload", requestId },
        { status: 400 }
      );
    }

    if (
      !verifyRazorpayCheckoutSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      })
    ) {
      return NextResponse.json(
        { error: "Invalid Razorpay signature", requestId },
        { status: 422 }
      );
    }

    await dbConnect();

    const existing = await Payment.findOne({
      razorpayOrderId,
      userId: user.id,
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment order not found", requestId },
        { status: 404 }
      );
    }

    if (existing.status === "captured") {
      if (
        existing.razorpayPaymentId &&
        existing.razorpayPaymentId !== razorpayPaymentId
      ) {
        return NextResponse.json(
          { error: "Payment already captured with different reference", requestId },
          { status: 409 }
        );
      }

      const currentUser = await User.findById(user.id).select("creditsRemaining");
      const result: PaymentVerifyResponse = {
        ok: true,
        paymentId: existing.razorpayPaymentId || razorpayPaymentId,
        status: "captured",
        creditsAdded: 0,
        creditsRemaining: currentUser?.creditsRemaining ?? user.creditsRemaining,
      };
      return NextResponse.json({ ...result, requestId });
    }

    const capturedPayment = await Payment.findOneAndUpdate(
      { _id: existing._id, status: { $ne: "captured" } },
      {
        $set: {
          status: "captured",
          razorpayPaymentId,
          razorpaySignature,
        },
      },
      { new: true }
    );

    if (!capturedPayment) {
      const currentUser = await User.findById(user.id).select("creditsRemaining");
      const result: PaymentVerifyResponse = {
        ok: true,
        paymentId: razorpayPaymentId,
        status: "captured",
        creditsAdded: 0,
        creditsRemaining: currentUser?.creditsRemaining ?? user.creditsRemaining,
      };
      return NextResponse.json({ ...result, requestId });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $inc: { creditsRemaining: capturedPayment.creditsToAdd } },
      { new: true }
    ).select("creditsRemaining");

    const result: PaymentVerifyResponse = {
      ok: true,
      paymentId: razorpayPaymentId,
      status: "captured",
      creditsAdded: capturedPayment.creditsToAdd,
      creditsRemaining: updatedUser?.creditsRemaining ?? user.creditsRemaining,
    };

    return NextResponse.json({ ...result, requestId });
  } catch (error) {
    console.error("POST /api/payments/verify error", { requestId, error });
    return NextResponse.json(
      { error: "Failed to verify payment", requestId },
      { status: 500 }
    );
  }
}
