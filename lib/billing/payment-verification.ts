export type RazorpayPaymentProof = {
  id?: unknown;
  order_id?: unknown;
  status?: unknown;
  amount?: unknown;
  currency?: unknown;
};

export type PurchasePaymentExpectation = {
  razorpayOrderId?: string | null;
  amountPaise: number;
  currency: string;
};

function verificationError(message: string) {
  const error = new Error(message);
  (error as Error & { status?: number }).status = 409;
  return error;
}

export function validateCapturedRazorpayPayment(input: {
  payment: RazorpayPaymentProof;
  purchase: PurchasePaymentExpectation;
  /** null for a subscription payment, which carries subscription_id instead of an order. */
  expectedOrderId: string | null;
  expectedPaymentId?: string | null;
}) {
  const paymentId = String(input.payment.id || "");
  const paymentOrderId = String(input.payment.order_id || "");
  const paymentStatus = String(input.payment.status || "").toLowerCase();
  const paymentAmount = Number(input.payment.amount);
  const paymentCurrency = String(input.payment.currency || "").toUpperCase();
  const purchaseCurrency = input.purchase.currency.toUpperCase();

  // A subscription payment is identified by subscription_id and invoice_id, not
  // by an order — its purchase row legitimately has razorpayOrderId null. The
  // order checks are skipped in that case ONLY; the amount, currency, status and
  // payment-identity checks below still apply in full, so nothing is relaxed
  // about what the customer was actually charged.
  if (input.expectedOrderId !== null) {
    if (!input.purchase.razorpayOrderId || input.purchase.razorpayOrderId !== input.expectedOrderId) {
      throw verificationError("Payment order does not match the purchase.");
    }
    if (paymentOrderId !== input.expectedOrderId) {
      throw verificationError("Razorpay payment belongs to a different order.");
    }
  }
  if (input.expectedPaymentId && paymentId !== input.expectedPaymentId) {
    throw verificationError("Razorpay payment identity does not match.");
  }
  if (paymentStatus !== "captured") {
    throw verificationError("Razorpay payment is not captured.");
  }
  if (!Number.isSafeInteger(paymentAmount) || paymentAmount !== input.purchase.amountPaise) {
    throw verificationError("Razorpay payment amount does not match the purchase.");
  }
  if (!paymentCurrency || paymentCurrency !== purchaseCurrency) {
    throw verificationError("Razorpay payment currency does not match the purchase.");
  }

  return {
    paymentId,
    orderId: paymentOrderId,
    amount: paymentAmount,
    currency: paymentCurrency,
    status: "captured" as const,
  };
}
