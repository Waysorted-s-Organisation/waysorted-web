import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProductActivityResumedEvent,
  buildProductInactiveEvent,
  buildSubscriptionPurchaseCompletedEvent,
  requirePurchaseCompletionNotification,
} from "../lib/notifications";
import { getN4ScanWindow } from "../lib/n4-scan-window";

test("N4 inactivity event is deterministic for repeated daily scans", () => {
  const input = {
    userId: "user-1",
    email: "user@example.com",
    lastActivityAt: new Date("2026-07-20T10:00:00.000Z"),
    lastActivityType: "login" as const,
    lastActivitySource: "web",
    inactivityDays: 7,
  };
  const first = buildProductInactiveEvent({
    ...input,
    detectedAt: new Date("2026-07-27T11:00:00.000Z"),
  });
  const retry = buildProductInactiveEvent({
    ...input,
    detectedAt: new Date("2026-07-27T12:00:00.000Z"),
  });
  assert.equal(first.eventId, retry.eventId);
  assert.equal(first.payload?.activity_coverage, "successful_logins_and_credited_tools");
});

test("N4 resumed activity event uses the activity identity", () => {
  const event = buildProductActivityResumedEvent({
    userId: "user-1",
    email: "user@example.com",
    activityId: "session-1",
    activityType: "login",
    activitySource: "otp",
  });
  assert.equal(event.eventId, "product_activity_resumed:user-1:login:session-1");
  assert.equal(event.eventType, "product_activity_resumed");
});

test("N4 scan window prevents historical backfill", () => {
  const window = getN4ScanWindow({
    now: new Date("2026-08-06T04:00:00.000Z"),
    producerStartedAt: new Date("2026-08-05T12:00:00.000Z"),
    inactivityDays: 7,
    lookbackHours: 26,
  });
  assert.equal(window.cutoff.toISOString(), "2026-07-30T04:00:00.000Z");
  assert.equal(window.lowerBound.toISOString(), "2026-07-29T12:00:00.000Z");
});


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
