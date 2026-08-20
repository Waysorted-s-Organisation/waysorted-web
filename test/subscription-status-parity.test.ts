/**
 * The "live subscription" status set, and the places that must agree on it.
 *
 * This set decides whether a customer has a subscription at all. It was written
 * out by hand in five places and had drifted in most of them - usually by
 * omitting "scheduled", which is where EVERY discounted subscription rests for
 * its entire first cycle. The consequences ranged from a paying customer being
 * shown "Free" to having no way to cancel what they had just bought.
 *
 * The worst drift is between the mongoose query and the partial unique index:
 * a status the index counts as live but the query does not means the create
 * route cannot see an existing subscription, makes a second one, and the index
 * rejects the insert with an opaque E11000 - after a payable provider
 * subscription has already been created and leaked.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  LIVE_SUBSCRIPTION_STATUSES,
  hasSubscriptionEntitlement,
  isLiveSubscriptionStatus,
} from "@/lib/billing/subscription-status";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("the unique index and the shared set contain exactly the same statuses", () => {
  const model = read("models/subscription.ts");
  const block = model.slice(
    model.indexOf("one_live_subscription_per_user") - 700,
    model.indexOf("one_live_subscription_per_user"),
  );
  const listed = [...block.matchAll(/"(payment_pending|scheduled|active|cancel_scheduled|halted)"/g)]
    .map((m) => m[1]);

  assert.deepEqual(
    [...new Set(listed)].sort(),
    [...LIVE_SUBSCRIPTION_STATUSES].sort(),
    "models/subscription.ts index and LIVE_SUBSCRIPTION_STATUSES have drifted",
  );
});

test("scheduled is live - it is where every discounted subscription sits", () => {
  assert.ok(isLiveSubscriptionStatus("scheduled"));
  assert.ok(hasSubscriptionEntitlement("scheduled"));
});

test("entitlement is narrower than existence, and cancelling follows existence", () => {
  // payment_pending has not paid and halted needs attention, so neither is
  // entitled - but both are still cancellable. Gating a cancel control on
  // entitlement stranded those customers with a subscription they could not end.
  for (const status of ["payment_pending", "halted"]) {
    assert.ok(isLiveSubscriptionStatus(status), `${status} still exists`);
    assert.ok(!hasSubscriptionEntitlement(status), `${status} is not entitled`);
  }
});

test("a dead subscription is neither", () => {
  for (const status of ["cancelled", "expired", "inactive", "", null, undefined]) {
    assert.ok(!isLiveSubscriptionStatus(status));
    assert.ok(!hasSubscriptionEntitlement(status));
  }
});

test("no surface hand-rolls the set any more", () => {
  // Each of these used its own literal list and each had drifted.
  for (const file of [
    "app/billing/billing-client.tsx",
    "app/settings/components/SubscriptionCard/index.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(
      source,
      /\["active", "cancel_scheduled"[^\]]*\]\.includes/,
      `${file} must use the shared status helpers`,
    );
  }
  assert.match(read("lib/billing/db.ts"), /LIVE_SUBSCRIPTION_STATUSES/);
});

test("an immediate cancellation is not recorded as cancelling at period end", () => {
  // Razorpay refuses a cycle-end cancellation when there is no billing cycle
  // yet, and the route falls back to cancelling outright. It still wrote
  // "cancel_scheduled" locally - telling the customer they kept access to a
  // subscription that no longer existed - and skipped the coupon release, so
  // their one-per-user code was consumed forever.
  const route = read("app/api/billing/subscriptions/cancel/route.ts");
  assert.match(route, /cancelledImmediatelyAsFallback = true;/);
  assert.match(route, /providerAlreadyCancelled \|\| cancelledImmediatelyAsFallback \? false/);
});
