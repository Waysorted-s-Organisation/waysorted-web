import { NextResponse } from "next/server";

const DEFAULT_AMOUNT_INR = 100;

type OrderRequestBody = {
  amount?: number | string;
  name?: string;
  email?: string;
  contact?: string;
};

function parseAmountInPaise(rawAmount: number | string | undefined) {
  if (rawAmount === undefined || rawAmount === null || rawAmount === "") {
    return DEFAULT_AMOUNT_INR * 100;
  }

  const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount in INR.");
  }

  const rounded = Math.round(amount * 100);
  if (rounded < 100) {
    throw new Error("Minimum amount is INR 1.");
  }

  return rounded;
}

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!keyId || !keySecret || !publicKeyId) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured on the server." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as OrderRequestBody;
    const amount = parseAmountInPaise(body.amount);
    const receipt = `waysorted-test-${Date.now()}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
        notes: {
          source: "waysorted-payment-page",
          mode: publicKeyId.startsWith("rzp_test_") ? "test" : "live",
          name: body.name?.trim() || "Manual Test",
          email: body.email?.trim() || "",
          contact: body.contact?.trim() || "",
        },
      }),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      const errorDescription =
        payload?.error?.description || payload?.error?.reason || "Unable to create Razorpay order.";

      return NextResponse.json(
        { error: errorDescription },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(
      {
        id: payload.id,
        amount: payload.amount,
        currency: payload.currency,
        receipt: payload.receipt,
        key: publicKeyId,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    const message = error instanceof Error ? error.message : "Unable to create payment order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
