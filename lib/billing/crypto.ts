import crypto from "crypto";

type SignedPayload<T> = {
  payload: T;
  signature: string;
};

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signValue(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createSignedToken<T extends Record<string, unknown>>(payload: T, secret: string) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySignedToken<T extends Record<string, unknown>>(
  token: string,
  secret: string,
): SignedPayload<T> | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signValue(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) return null;

  const payload = JSON.parse(fromBase64Url(encodedPayload)) as T;
  return { payload, signature };
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}) {
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyRazorpaySubscriptionSignature({
  subscriptionId,
  paymentId,
  signature,
  secret,
}: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
  secret: string;
}) {
  // Razorpay signs subscriptions as `payment_id|subscription_id` - the OPPOSITE operand order to
  // orders (`order_id|payment_id`, see verifyRazorpaySignature above). Reversing these makes every
  // subscription payment fail verification after the customer has already been charged.
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}
