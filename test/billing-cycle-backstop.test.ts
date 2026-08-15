import assert from "node:assert/strict";
import test from "node:test";
import { buildSubscriptionCycleKey } from "../lib/billing/webhook-payload";

/**
 * The renewal backstop must produce byte-identical cycle keys to the webhook path.
 *
 * Both write to creditledgers.idempotencyKey, which is uniquely indexed in production, so matching
 * keys are what make whichever path arrives second a harmless no-op. A divergent format would
 * double-credit instead - which is exactly what happened to the first paying customer, whose two
 * grants differed only by an inserted ":payment:" segment.
 */

const SUBSCRIPTION_ID = "sub_TOb5usZhc3sT0c";
const PAYMENT_ID = "pay_TObOhaR5NGFELC";

test("cycle key matches the webhook format exactly", () => {
  assert.equal(
    buildSubscriptionCycleKey(SUBSCRIPTION_ID, PAYMENT_ID),
    `${SUBSCRIPTION_ID}:payment:${PAYMENT_ID}`,
  );
});

test("the key is stable across calls, so re-runs dedupe", () => {
  const a = buildSubscriptionCycleKey(SUBSCRIPTION_ID, PAYMENT_ID);
  const b = buildSubscriptionCycleKey(SUBSCRIPTION_ID, PAYMENT_ID);
  assert.equal(a, b);
});

test("different payments produce different keys", () => {
  assert.notEqual(
    buildSubscriptionCycleKey(SUBSCRIPTION_ID, "pay_AAAA"),
    buildSubscriptionCycleKey(SUBSCRIPTION_ID, "pay_BBBB"),
  );
});

test("the legacy key format is NOT produced", () => {
  // The pre-fix format omitted ":payment:". Emitting it again would bypass the unique index and
  // credit the same renewal twice.
  const key = buildSubscriptionCycleKey(SUBSCRIPTION_ID, PAYMENT_ID);
  assert.notEqual(key, `${SUBSCRIPTION_ID}:${PAYMENT_ID}`);
  assert.ok(key.includes(":payment:"));
});
