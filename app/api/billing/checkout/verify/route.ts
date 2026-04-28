import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getRazorpayConfig } from "@/lib/billing/env";
import { findPurchaseByUserAndReference } from "@/lib/billing/db";
import { fetchRazorpayPayment } from "@/lib/billing/razorpay";
import { verifyRazorpaySignature } from "@/lib/billing/crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type VerifyBody = {
  purchaseId?: string;
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  bridgeToken?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = body.orderId?.trim() || body.razorpay_order_id?.trim() || "";
    const paymentId = body.razorpay_payment_id?.trim() || "";
    const signature = body.razorpay_signature?.trim() || "";

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing verification fields." }, { status: 400 });
    }

    if (
      !verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
        secret: getRazorpayConfig().keySecret,
      })
    ) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const purchase = await findPurchaseByUserAndReference({
      userId: String(auth.user._id),
      purchaseId: body.purchaseId?.trim() || null,
      razorpayOrderId: orderId,
    });

    if (purchase) {
      purchase.razorpayOrderId ||= orderId;
      purchase.razorpayPaymentId ||= paymentId;
      if (purchase.status === "created") {
        purchase.status = "pending";
      }
      await purchase.save();
    }

    const payment = await fetchRazorpayPayment(paymentId);

    return NextResponse.json({
      verified: true,
      payment,
      authoritativeSource: "webhook",
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/verify error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify payment." },
      { status },
    );
  }
}
