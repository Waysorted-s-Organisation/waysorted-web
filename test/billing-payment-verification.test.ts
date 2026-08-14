import assert from "node:assert/strict";
import test from "node:test";
import { validateCapturedRazorpayPayment } from "../lib/billing/payment-verification";

const purchase = {
  razorpayOrderId: "order_1",
  amountPaise: 34_900,
  currency: "INR",
};

const payment = {
  id: "pay_1",
  order_id: "order_1",
  status: "captured",
  amount: 34_900,
  currency: "INR",
};

test("accepts a captured payment matching the persisted checkout snapshot", () => {
  assert.deepEqual(
    validateCapturedRazorpayPayment({
      payment,
      purchase,
      expectedOrderId: "order_1",
      expectedPaymentId: "pay_1",
    }),
    {
      paymentId: "pay_1",
      orderId: "order_1",
      amount: 34_900,
      currency: "INR",
      status: "captured",
    },
  );
});

for (const [name, changed] of [
  ["order", { order_id: "order_other" }],
  ["payment identity", { id: "pay_other" }],
  ["status", { status: "authorized" }],
  ["amount", { amount: 1 }],
  ["currency", { currency: "USD" }],
] as const) {
  test(`rejects a mismatched ${name}`, () => {
    assert.throws(
      () => validateCapturedRazorpayPayment({
        payment: { ...payment, ...changed },
        purchase,
        expectedOrderId: "order_1",
        expectedPaymentId: "pay_1",
      }),
      (error: unknown) =>
        error instanceof Error &&
        (error as Error & { status?: number }).status === 409,
    );
  });
}

test("rejects when the requested order is not the purchase order", () => {
  assert.throws(
    () => validateCapturedRazorpayPayment({
      payment,
      purchase,
      expectedOrderId: "order_other",
      expectedPaymentId: "pay_1",
    }),
    /does not match the purchase/,
  );
});
