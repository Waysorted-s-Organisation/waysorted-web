import assert from "node:assert/strict";
import test from "node:test";
import Subscription from "../models/subscription";

/**
 * A subscription whose mandate is authorised with its first charge booked for a FUTURE date is not
 * an abandoned checkout - `authenticated` is its correct resting state for the whole first cycle.
 *
 * The 2h reconciler cancels provider subscriptions sitting in created/pending/authenticated with no
 * confirmed purchase. Without the guard below it would cancel every future-dated subscription about
 * two hours after the customer signed up, which is exactly the shape a first-cycle discount takes.
 */

const NOW = Date.UTC(2026, 7, 16, 12, 0, 0);
const HOUR = 3600_000;

/** Mirrors the guard in lib/billing/subscription-reconciliation.ts. */
function isScheduled(providerStatus: string, chargeAtMs: number | null, now = NOW) {
  return providerStatus === "authenticated" && chargeAtMs !== null && chargeAtMs > now;
}

test("an authenticated subscription charging next month is scheduled, not abandoned", () => {
  assert.equal(isScheduled("authenticated", NOW + 30 * 24 * HOUR), true);
});

test("an authenticated subscription whose charge date has passed is NOT protected", () => {
  // Genuinely stuck: authorised, charge date elapsed, nothing happened. The sweep should still act.
  assert.equal(isScheduled("authenticated", NOW - HOUR), false);
});

test("created and pending are never protected - those are real abandoned checkouts", () => {
  // The customer never authorised anything, so there is no mandate to preserve.
  assert.equal(isScheduled("created", NOW + 30 * 24 * HOUR), false);
  assert.equal(isScheduled("pending", NOW + 30 * 24 * HOUR), false);
});

test("a missing charge date is not treated as scheduled", () => {
  assert.equal(isScheduled("authenticated", null), false);
});

test("scheduled is a live status in the model enum", () => {
  const path = Subscription.schema.path("status") as unknown as {
    enumValues?: string[];
  };
  assert.ok(path.enumValues?.includes("scheduled"), "status enum must accept `scheduled`");
});

test("scheduled occupies the one-live-subscription slot", () => {
  // If `scheduled` were missing from the partial index, a user could hold a scheduled AND an active
  // subscription simultaneously and be billed twice.
  const liveIndex = Subscription.schema
    .indexes()
    .find(([, options]) => (options as { name?: string })?.name === "one_live_subscription_per_user");

  assert.ok(liveIndex, "one_live_subscription_per_user index must exist");
  const filter = (liveIndex![1] as { partialFilterExpression?: { status?: { $in?: string[] } } })
    .partialFilterExpression;
  assert.ok(filter?.status?.$in?.includes("scheduled"), "index must cover `scheduled`");
  // The reconciler query keys off payment_pending, so scheduled rows must NOT also be swept.
  assert.ok(filter?.status?.$in?.includes("payment_pending"));
  assert.ok(filter?.status?.$in?.includes("active"));
});
