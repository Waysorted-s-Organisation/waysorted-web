import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getRazorpayConfig } from "@/lib/billing/env";
import { applyPurchaseCredits, findPurchaseByUserAndReference } from "@/lib/billing/db";
import { fetchRazorpayPayment } from "@/lib/billing/razorpay";
import { verifyRazorpaySignature } from "@/lib/billing/crypto";
import { validateCapturedRazorpayPayment } from "@/lib/billing/payment-verification";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type VerifyBody = {
  purchaseId?: string;
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));

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

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found." }, { status: 404 });
    }

    const payment = await fetchRazorpayPayment(paymentId);
    const verifiedPayment = validateCapturedRazorpayPayment({
      payment,
      purchase,
      expectedOrderId: orderId,
      expectedPaymentId: paymentId,
    });

    purchase.razorpayPaymentId ||= verifiedPayment.paymentId;
    if (purchase.status !== "refunded" && purchase.status !== "partially_refunded") {
      purchase.status = "captured";
      purchase.capturedAt ||= new Date();
    }
    await purchase.save();

    const reconciledPurchase = await applyPurchaseCredits(purchase);

    return NextResponse.json({
      verified: true,
      purchaseId: String(reconciledPurchase._id),
      status: reconciledPurchase.status,
      creditsApplied: reconciledPurchase.grantApplied,
      authoritativeSource: "server_verified_payment",
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/verify error:", error);
    return billingErrorResponse(error, "Unable to verify payment.", "payment_verification_failed");
  }
}
