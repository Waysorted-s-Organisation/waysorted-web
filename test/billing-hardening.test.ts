import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney, minorUnitMultiplier } from "../lib/billing/money";
import { resolveUsageCredits } from "../lib/billing/usagePricing";
import { isSubscriptionActive } from "../lib/billing/catalog";

test("currency subunits use explicit zero and three decimal conventions", () => {
  assert.equal(minorUnitMultiplier("JPY"), 1);
  assert.equal(minorUnitMultiplier("KRW"), 1);
  assert.equal(minorUnitMultiplier("KWD"), 1000);
  assert.match(formatMoney(928, "JPY"), /928/);
});

test("import reservations hold the maximum tier regardless of client-declared size", () => {
  const tinyClaim = resolveUsageCredits({
    featureCode: "import_file",
    toolCode: "psd",
    sizeBytes: 1,
  });
  const largeClaim = resolveUsageCredits({
    featureCode: "import_file",
    toolCode: "psd",
    sizeBytes: 190 * 1024 * 1024,
  });
  assert.equal(tinyClaim.creditsRequired, 80);
  assert.equal(largeClaim.creditsRequired, 80);
  assert.equal(tinyClaim.selectedOptions.provisionalMaximumHold, true);
});

test("import pricing rejects zero, negative, fractional, and oversized sizes", () => {
  for (const sizeBytes of [0, -1, 1.5, 201 * 1024 * 1024]) {
    assert.throws(() => resolveUsageCredits({
      featureCode: "import_file",
      toolCode: "psd",
      sizeBytes,
    }));
  }
});

test("subscription access fails closed when the renewal boundary is missing", () => {
  assert.equal(isSubscriptionActive("active", null), false);
  assert.equal(isSubscriptionActive("cancel_scheduled", null), false);
  assert.equal(isSubscriptionActive("active", new Date(Date.now() + 60_000)), true);
});
