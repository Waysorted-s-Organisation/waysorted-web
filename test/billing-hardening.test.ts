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

test("comment summaries use authoritative fixed single and batch prices", () => {
  const single = resolveUsageCredits({
    featureCode: "comment_summarize_single",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 999, commentCount: 1, artifact: "summary" },
  });
  const actionable = resolveUsageCredits({
    featureCode: "comment_summarize_single",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 999, commentCount: 1, artifact: "actionable" },
  });
  const oneCommentBatch = resolveUsageCredits({
    featureCode: "comment_summarize_batch",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 1, commentCount: 1 },
  });
  const manyCommentBatch = resolveUsageCredits({
    featureCode: "comment_summarize_batch",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 999, commentCount: 250 },
  });

  assert.equal(single.creditsRequired, 5);
  assert.equal(actionable.creditsRequired, 5);
  assert.equal(oneCommentBatch.creditsRequired, 20);
  assert.equal(manyCommentBatch.creditsRequired, 20);
});

test("comment page scopes cost 10 credits per reservation", () => {
  const pageScope = resolveUsageCredits({
    featureCode: "comment_page_scope",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 1, pageCount: 999 },
  });

  assert.equal(pageScope.creditsRequired, 10);
  assert.equal(pageScope.requiresSubscription, true);
});

test("comment Section scopes use plan-aware authoritative prices", () => {
  const paidSection = resolveUsageCredits({
    featureCode: "comment_section_scope_paid",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 999 },
  });
  const freeSection = resolveUsageCredits({
    featureCode: "comment_section_scope_free",
    toolCode: "comment_summarizer",
    selectedOptions: { creditsRequired: 1 },
  });

  assert.equal(paidSection.creditsRequired, 5);
  assert.equal(paidSection.requiresSubscription, true);
  assert.equal(freeSection.creditsRequired, 10);
  assert.equal(freeSection.requiresSubscription, false);
});
