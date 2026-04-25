import crypto from "crypto";
import Razorpay from "razorpay";

interface CreateOrderPayload {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

function readEnvTrimmed(key: string) {
  const value = process.env[key];
  return value ? value.trim() : "";
}

function isLikelyRazorpayKeyId(value: string) {
  return /^rzp_(test|live)_/.test(value);
}

export async function createRazorpayOrder(payload: CreateOrderPayload): Promise<RazorpayOrder> {
  const keyId = readEnvTrimmed("RAZORPAY_KEY_ID");
  const keySecret = readEnvTrimmed("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials");
  }

  if (!isLikelyRazorpayKeyId(keyId)) {
    throw new Error(
      "RAZORPAY_KEY_ID must be your publishable Key Id from Razorpay Dashboard → Account & Settings → API Keys (looks like rzp_test_… or rzp_live_…). You may have pasted the Key Secret into the wrong variable."
    );
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: payload.amountPaise,
      currency: payload.currency,
      receipt: payload.receipt,
      notes: payload.notes || {},
    });

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || payload.receipt,
      status: order.status,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Razorpay order failed";
    if (/authentication|unauthorized|key/i.test(message)) {
      throw new Error(
        `${message}. Use Key Id + Key Secret from the same Razorpay mode (test/live), then restart the server.`
      );
    }
    throw new Error(message);
  }
}

export function verifyRazorpayCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const keySecret = readEnvTrimmed("RAZORPAY_KEY_SECRET");
  if (!keySecret) throw new Error("Missing RAZORPAY_KEY_SECRET");

  const hmac = crypto.createHmac("sha256", keySecret);
  hmac.update(`${params.orderId}|${params.paymentId}`);
  const expected = hmac.digest("hex");
  return expected === params.signature;
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = readEnvTrimmed("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(rawBody);
  const expected = hmac.digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
