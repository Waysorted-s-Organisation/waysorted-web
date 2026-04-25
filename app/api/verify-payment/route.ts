import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/payment";
import User from "@/models/user";
import { getCurrentUser } from "@/lib/user";
import { verifyRazorpayCheckoutSignature } from "@/lib/payments/razorpay";

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 });
    }

    const body = (await req.json()) as VerifyBody;
    const orderId = (body.razorpay_order_id || body.razorpayOrderId || "").trim();
    const paymentId = (body.razorpay_payment_id || body.razorpayPaymentId || "").trim();
    const signature = (body.razorpay_signature || body.razorpaySignature || "").trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing fields: order_id, payment_id, signature", requestId },
        { status: 400 }
      );
    }

    const signatureValid = verifyRazorpayCheckoutSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!signatureValid) {
      return NextResponse.json(
        { error: "Signature mismatch", requestId },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await Payment.findOne({ razorpayOrderId: orderId, userId: user.id });
    if (!existing) {
      const currentUser = await User.findById(user.id).select("creditsRemaining");
      return NextResponse.json(
        {
          ok: true,
          verified: true,
          linked: false,
          status: "captured",
          creditsAdded: 0,
          creditsRemaining: currentUser?.creditsRemaining ?? user.creditsRemaining,
          requestId,
        },
        { status: 200 }
      );
    }

    let creditsAdded = 0;
    if (existing.status !== "captured") {
      await Payment.updateOne(
        { _id: existing._id, status: { $ne: "captured" } },
        {
          $set: {
            status: "captured",
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
          },
        }
      );

      await User.findByIdAndUpdate(existing.userId, {
        $inc: { creditsRemaining: existing.creditsToAdd },
      });
      creditsAdded = existing.creditsToAdd;
    }

    const updatedUser = await User.findById(user.id).select("creditsRemaining");

    return NextResponse.json({
      ok: true,
      verified: true,
      linked: true,
      status: "captured",
      creditsAdded,
      creditsRemaining: updatedUser?.creditsRemaining ?? user.creditsRemaining,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
