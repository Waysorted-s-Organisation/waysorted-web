import assert from "node:assert/strict";
import test from "node:test";
import {
  verifyRazorpaySignature,
  verifyRazorpaySubscriptionSignature,
} from "../lib/billing/crypto";

/**
 * Razorpay signs orders and subscriptions with DIFFERENT operand orders:
 *
 *   order        -> HMAC_SHA256(`${razorpay_order_id}|${razorpay_payment_id}`, key_secret)
 *   subscription -> HMAC_SHA256(`${razorpay_payment_id}|${razorpay_subscription_id}`, key_secret)
 *
 * The digests below are pinned constants computed independently of the implementation. They are
 * deliberately NOT produced by calling the helpers under test: a round-trip fixture passes whatever
 * order the implementation happens to use, which is exactly how the reversed subscription operands
 * reached production and failed every subscription payment after the customer had been charged.
 */
const KEY_SECRET = "rzp_test_secret_key";
const SUBSCRIPTION_ID = "sub_29QwerAsdf1234";
const PAYMENT_ID = "pay_29QwerZxcv5678";
const ORDER_ID = "order_29QwerQwer9012";

const VALID_SUBSCRIPTION_SIGNATURE =
  "405f78507b88311a37e02403423176c8bcfa2c0754651eaad33a46b87fabfafe";
const REVERSED_SUBSCRIPTION_SIGNATURE =
  "651494099a7e460795f0d64c2313fc08fcf8d79acefb0b1a9b5f76da8297d468";
const VALID_ORDER_SIGNATURE =
  "5cf71c231255d9143619bd4c74c404a2b619e7149df71763db1b950b25f01e00";

test("subscription signature is HMAC over payment_id|subscription_id", () => {
  assert.equal(
    verifyRazorpaySubscriptionSignature({
      subscriptionId: SUBSCRIPTION_ID,
      paymentId: PAYMENT_ID,
      signature: VALID_SUBSCRIPTION_SIGNATURE,
      secret: KEY_SECRET,
    }),
    true,
  );
});

test("subscription signature rejects the reversed subscription_id|payment_id order", () => {
  // This is the exact regression: accepting this digest means the operands are swapped again.
  assert.equal(
    verifyRazorpaySubscriptionSignature({
      subscriptionId: SUBSCRIPTION_ID,
      paymentId: PAYMENT_ID,
      signature: REVERSED_SUBSCRIPTION_SIGNATURE,
      secret: KEY_SECRET,
    }),
    false,
  );
});

test("order signature is HMAC over order_id|payment_id", () => {
  assert.equal(
    verifyRazorpaySignature({
      orderId: ORDER_ID,
      paymentId: PAYMENT_ID,
      signature: VALID_ORDER_SIGNATURE,
      secret: KEY_SECRET,
    }),
    true,
  );
});

test("order and subscription signatures are not interchangeable", () => {
  assert.equal(
    verifyRazorpaySignature({
      orderId: ORDER_ID,
      paymentId: PAYMENT_ID,
      signature: VALID_SUBSCRIPTION_SIGNATURE,
      secret: KEY_SECRET,
    }),
    false,
  );
  assert.equal(
    verifyRazorpaySubscriptionSignature({
      subscriptionId: SUBSCRIPTION_ID,
      paymentId: PAYMENT_ID,
      signature: VALID_ORDER_SIGNATURE,
      secret: KEY_SECRET,
    }),
    false,
  );
});

test("signature verification rejects empty, truncated, and wrong-secret values", () => {
  const base = {
    subscriptionId: SUBSCRIPTION_ID,
    paymentId: PAYMENT_ID,
    secret: KEY_SECRET,
  };
  assert.equal(verifyRazorpaySubscriptionSignature({ ...base, signature: "" }), false);
  assert.equal(
    verifyRazorpaySubscriptionSignature({
      ...base,
      signature: VALID_SUBSCRIPTION_SIGNATURE.slice(0, 32),
    }),
    false,
  );
  assert.equal(
    verifyRazorpaySubscriptionSignature({
      ...base,
      secret: "wrong_secret",
      signature: VALID_SUBSCRIPTION_SIGNATURE,
    }),
    false,
  );
});
