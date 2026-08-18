import assert from "node:assert/strict";
import test from "node:test";

/**
 * A recovery job that catches every per-item error still FULFILLS, so it never registers as a
 * rejected promise and the cron stays green. Without a health signal the entire recovery layer can
 * be dead - a rotated Razorpay key, an outage, a rate limit - while reporting success every night.
 *
 * These pin the classification rules; collectPaymentAlerts itself needs a live database.
 */

type JobHealth = { name: string; scanned?: number; failed?: number; rejected?: boolean };

/** Mirrors the job-health branch of collectPaymentAlerts. */
function classify(jobs: JobHealth[]) {
  const failing = jobs.filter((j) => j.rejected || (j.failed ?? 0) > 0);
  if (!failing.length) return null;
  const dead = failing.filter(
    (j) => j.rejected || ((j.scanned ?? 0) > 0 && j.failed === j.scanned),
  );
  return { severity: dead.length ? "critical" : "warning", failing: failing.length, dead: dead.length };
}

test("a healthy run raises nothing", () => {
  assert.equal(
    classify([
      { name: "backstop", scanned: 2, failed: 0 },
      { name: "purchases", scanned: 5, failed: 0 },
    ]),
    null,
  );
});

test("a job whose every item failed is critical", () => {
  // Razorpay outage or rotated key: scanned 2, failed 2, granted 0, missingDeliveries empty - the
  // shape that previously produced a green cron.
  const result = classify([{ name: "backstop", scanned: 2, failed: 2 }]);
  assert.equal(result?.severity, "critical");
  assert.equal(result?.dead, 1);
});

test("a rejected job is critical even with no counters", () => {
  const result = classify([{ name: "backstop", rejected: true }]);
  assert.equal(result?.severity, "critical");
});

test("partial item failures warn rather than page", () => {
  const result = classify([{ name: "purchases", scanned: 10, failed: 2 }]);
  assert.equal(result?.severity, "warning");
  assert.equal(result?.dead, 0);
});

test("a job that scanned nothing is not treated as dead", () => {
  // No active subscriptions is a normal state, not a failure.
  assert.equal(classify([{ name: "backstop", scanned: 0, failed: 0 }]), null);
});
