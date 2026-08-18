import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWebhookClaimFilter,
  buildWebhookLeaseTimes,
  isRetryableWebhookIgnoreReason,
  isTerminalWebhookStatus,
  deriveRazorpayEventId,
  sanitizeRazorpayWebhookPayload,
  WEBHOOK_PROCESSING_LEASE_MS,
} from "../lib/billing/webhook-processing";

test("webhook processing lease expires after two minutes by default", () => {
  const now = new Date("2026-08-13T08:00:00.000Z");
  const lease = buildWebhookLeaseTimes(now);

  assert.equal(lease.processingStartedAt, now);
  assert.equal(
    lease.processingLeaseExpiresAt.getTime(),
    now.getTime() + WEBHOOK_PROCESSING_LEASE_MS,
  );
});

test("temporary database ordering races remain retryable", () => {
  assert.equal(isRetryableWebhookIgnoreReason("purchase_not_found"), true);
  assert.equal(isRetryableWebhookIgnoreReason("subscription_not_found"), true);
});

test("claim accepts new failures and only expired processing attempts", () => {
  const now = new Date("2026-08-13T08:00:00.000Z");
  const filter = buildWebhookClaimFilter("evt_1", now);

  assert.equal(filter.eventId, "evt_1");
  assert.deepEqual(filter.$or[0], {
    status: { $in: ["received", "failed"] },
  });
  assert.deepEqual(filter.$or[1], {
    status: "processing",
    processingLeaseExpiresAt: { $lte: now },
  });
  assert.deepEqual(filter.$or[2], {
    status: "processing",
    processingLeaseExpiresAt: null,
    updatedAt: { $lte: new Date(now.getTime() - WEBHOOK_PROCESSING_LEASE_MS) },
  });
});

test("malformed and unsupported events are permanent ignores", () => {
  assert.equal(isRetryableWebhookIgnoreReason("missing_order_id"), false);
  assert.equal(isRetryableWebhookIgnoreReason("unhandled_event"), false);
  assert.equal(isRetryableWebhookIgnoreReason(undefined), false);
});

test("only completed outcomes may be acknowledged as duplicate deliveries", () => {
  assert.equal(isTerminalWebhookStatus("processed"), true);
  assert.equal(isTerminalWebhookStatus("ignored"), true);
  assert.equal(isTerminalWebhookStatus("processing"), false);
  assert.equal(isTerminalWebhookStatus("received"), false);
  assert.equal(isTerminalWebhookStatus("failed"), false);
  assert.equal(isTerminalWebhookStatus(undefined), false);
});

test("event identity is stable and never falls back to the current time", () => {
  const payload = {
    event: "payment.captured",
    created_at: 1_700_000_000,
    payload: { payment: { entity: { id: "pay_1" } } },
  };
  assert.equal(deriveRazorpayEventId(payload, "evt_provider"), "evt_provider");
  assert.equal(
    deriveRazorpayEventId(payload),
    "payment.captured:pay_1:1700000000",
  );
  assert.equal(deriveRazorpayEventId({ event: "unknown" }), null);
});

test("persisted webhook payload strips payer PII and card data", () => {
  const sanitized = sanitizeRazorpayWebhookPayload({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_1",
          amount: 34900,
          currency: "INR",
          status: "captured",
          email: "private@example.com",
          contact: "9999999999",
          card: { last4: "1234" },
        },
      },
    },
  });
  const serialized = JSON.stringify(sanitized);
  assert.match(serialized, /pay_1/);
  assert.doesNotMatch(serialized, /private@example.com|9999999999|last4/);
});
