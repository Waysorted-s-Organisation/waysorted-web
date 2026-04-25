export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const publicKeyId =
    process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!keyId || !keySecret || !publicKeyId || !webhookSecret) {
    throw new Error("Missing Razorpay environment configuration.");
  }

  return {
    keyId,
    keySecret,
    publicKeyId,
    webhookSecret,
  };
}

export function getBridgeSecret() {
  const secret = process.env.BILLING_BRIDGE_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing BILLING_BRIDGE_SECRET.");
  }
  return secret;
}

export function getProcessorCallbackSecret() {
  const secret = process.env.PROCESSOR_CALLBACK_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing PROCESSOR_CALLBACK_SECRET.");
  }
  return secret;
}

export function getStarterGrantSecret() {
  const secret = process.env.STARTER_GRANT_SECRET?.trim() || process.env.BILLING_BRIDGE_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing STARTER_GRANT_SECRET.");
  }
  return secret;
}
