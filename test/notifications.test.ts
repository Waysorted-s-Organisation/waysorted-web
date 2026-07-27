import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSubscriptionPurchaseCompletedEvent,
  requirePurchaseCompletionNotification,
} from "../lib/notifications";


test("purchase completion event is deterministic for webhook retries", () => {
  const first = buildSubscriptionPurchaseCompletedEvent({
    userId: "user-1",
    email: "buyer@example.com",
    purchaseId: "purchase-1",
    subscriptionId: "subscription-1",
    productCode: "waysorted_pro_yearly",
    completionSource: "subscription.activated",
    occurredAt: new Date("2026-07-28T00:00:00.000Z"),
  });
  const retry = buildSubscriptionPurchaseCompletedEvent({
    userId: "user-1",
    email: "buyer@example.com",
    purchaseId: "purchase-1",
    subscriptionId: "subscription-1",
    productCode: "waysorted_pro_yearly",
    completionSource: "invoice.paid",
    occurredAt: new Date("2026-07-28T00:05:00.000Z"),
  });

  assert.equal(first.eventId, "subscription_purchase_completed:purchase-1");
  assert.equal(retry.eventId, first.eventId);
  assert.equal(retry.payload?.purchase_id, "purchase-1");
  assert.equal(retry.payload?.subscription_id, "subscription-1");
});

test("purchase completion falls back to subscription identity", () => {
  const event = buildSubscriptionPurchaseCompletedEvent({
    userId: "user-1",
    email: "buyer@example.com",
    purchaseId: null,
    subscriptionId: "subscription-1",
    productCode: "waysorted_pro_monthly",
    completionSource: "subscription.activated",
  });

  assert.equal(
    event.eventId,
    "subscription_purchase_completed:subscription-1",
  );
});

test("accepted completion notification lets the webhook finish", () => {
  assert.deepEqual(
    requirePurchaseCompletionNotification({ sent: true }),
    { sent: true },
  );
});

test("failed completion notification remains retryable", () => {
  assert.throws(
    () => requirePurchaseCompletionNotification({
      sent: false,
      reason: "rejected",
      status: 503,
    }),
    /Required subscription purchase completion notification failed: rejected:status_503/,
  );
  assert.throws(
    () => requirePurchaseCompletionNotification({
      sent: false,
      reason: "failed",
    }),
    /Required subscription purchase completion notification failed: failed/,
  );
});
