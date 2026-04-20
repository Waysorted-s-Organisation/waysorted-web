import crypto from "crypto";
import { NextResponse } from "next/server";

type VerifyRequestBody = {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured on the server." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as VerifyRequestBody;
    const orderId = body.orderId?.trim();
    const razorpayOrderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!orderId || !razorpayOrderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 },
      );
    }

    if (orderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Order mismatch during payment verification." },
        { status: 400 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 },
      );
    }

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      cache: "no-store",
    });

    const paymentPayload = await paymentResponse.json();
    if (!paymentResponse.ok) {
      const errorDescription =
        paymentPayload?.error?.description ||
        paymentPayload?.error?.reason ||
        "Payment verified, but fetching Razorpay payment details failed.";

      return NextResponse.json(
        {
          verified: true,
          payment: {
            id: paymentId,
            order_id: orderId,
          },
          warning: errorDescription,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    if (paymentPayload.order_id && paymentPayload.order_id !== orderId) {
      return NextResponse.json(
        { error: "Verified signature but payment did not belong to the expected order." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        verified: true,
        payment: {
          id: paymentPayload.id,
          order_id: paymentPayload.order_id,
          status: paymentPayload.status,
          method: paymentPayload.method,
          amount: paymentPayload.amount,
          currency: paymentPayload.currency,
          email: paymentPayload.email,
          contact: paymentPayload.contact,
          captured: paymentPayload.captured,
          created_at: paymentPayload.created_at,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Razorpay payment verification failed:", error);
    const message = error instanceof Error ? error.message : "Unable to verify payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
