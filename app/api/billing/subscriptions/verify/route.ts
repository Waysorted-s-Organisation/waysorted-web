import { NextRequest, NextResponse } from "next/server";
import Purchase from "@/models/purchase";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getRazorpayConfig } from "@/lib/billing/env";
import { verifyRazorpaySubscriptionSignature } from "@/lib/billing/crypto";
import { fetchRazorpayPayment, fetchRazorpaySubscription } from "@/lib/billing/razorpay";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type VerifySubscriptionBody = {
  purchaseId?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifySubscriptionBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaseId = body.purchaseId?.trim() || "";
    const subscriptionId = body.razorpay_subscription_id?.trim() || "";
    const paymentId = body.razorpay_payment_id?.trim() || "";
    const signature = body.razorpay_signature?.trim() || "";
    if (!purchaseId || !subscriptionId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing verification fields." }, { status: 400 });
    }

    if (!verifyRazorpaySubscriptionSignature({
      subscriptionId,
      paymentId,
      signature,
      secret: getRazorpayConfig().keySecret,
    })) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      user: auth.user._id,
      kind: "subscription",
      razorpaySubscriptionId: subscriptionId,
    });
    if (!purchase) return conflict("Subscription payment does not match this purchase.");

    const [payment, providerSubscription] = await Promise.all([
      fetchRazorpayPayment(paymentId),
      fetchRazorpaySubscription(subscriptionId),
    ]);
    if (payment.id !== paymentId || payment.subscription_id !== subscriptionId) {
      return conflict("Razorpay payment belongs to a different subscription.");
    }
    if (String(payment.status).toLowerCase() !== "captured") {
      return conflict("Razorpay payment is not captured.");
    }
    if (Number(payment.amount) !== purchase.amountPaise ||
        String(payment.currency).toUpperCase() !== String(purchase.currency).toUpperCase()) {
      return conflict("Razorpay payment amount does not match this purchase.");
    }
    if (
      providerSubscription.id !== subscriptionId ||
      String(providerSubscription.notes?.productCode || "") !== purchase.productCode
    ) {
      return conflict("Razorpay subscription does not match the selected plan.");
    }

    purchase.razorpayPaymentId ||= paymentId;
    purchase.status = "captured";
    purchase.capturedAt ||= new Date();
    purchase.notes = {
      ...(purchase.notes || {}),
      clientSubscriptionConfirmation: {
        paymentId,
        subscriptionId,
        confirmedAt: new Date().toISOString(),
      },
    };
    purchase.markModified("notes");
    await purchase.save();

    return NextResponse.json({
      verified: true,
      purchaseId: String(purchase._id),
      subscriptionId,
      paymentId,
      status: providerSubscription.status,
      authoritativeSource: "server_verified_payment",
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/verify error:", error);
    return NextResponse.json(
      { error: "Unable to verify subscription payment." },
      { status: 500 },
    );
  }
}
