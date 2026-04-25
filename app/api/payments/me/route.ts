import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/payment";
import { getCurrentUser } from "@/lib/user";

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401 }
      );
    }

    await dbConnect();
    const payments = await Payment.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .select(
        "planId billing amountPaise currency creditsToAdd status provider razorpayOrderId razorpayPaymentId failureCode failureReason createdAt updatedAt"
      );

    return NextResponse.json({ payments, requestId });
  } catch (error) {
    console.error("GET /api/payments/me error", { requestId, error });
    return NextResponse.json(
      { error: "Failed to fetch payments", requestId },
      { status: 500 }
    );
  }
}
