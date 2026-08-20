/**
 * The yearly saving badge.
 *
 * A badge that overstates the saving is a false price claim on a checkout page,
 * so the rounding direction and the refusals below are the point of this file.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { yearlySavingPercent } from "@/lib/billing/plan-savings";

const usd = (amountSubunits: number) => ({ amountSubunits, currency: "USD" });

test("the saving is measured against twelve months at the monthly price", () => {
  // $6/month is $72 a year; $29 saves $43, which is 59.7%.
  assert.equal(yearlySavingPercent(usd(600), usd(2900)), 59);
});

test("rounding is down, so the badge can never overstate", () => {
  // $10/month = $120. $101 saves 15.83% - it must not read 16%.
  assert.equal(yearlySavingPercent(usd(1000), usd(10100)), 15);
});

test("no badge when yearly is not actually cheaper", () => {
  assert.equal(yearlySavingPercent(usd(600), usd(7200)), null, "identical cost is not a saving");
  assert.equal(yearlySavingPercent(usd(600), usd(8000)), null, "dearer is not a saving");
});

test("no badge across currencies, because the numbers are not comparable", () => {
  // 499 INR/month against 29 USD/year would compute a ~99% saving from two
  // unrelated numbers.
  assert.equal(
    yearlySavingPercent({ amountSubunits: 49900, currency: "INR" }, { amountSubunits: 2900, currency: "USD" }),
    null,
  );
  assert.equal(
    yearlySavingPercent({ amountSubunits: 600, currency: "usd" }, { amountSubunits: 2900, currency: "USD" }),
    59,
    "case must not stop a legitimate comparison",
  );
});

test("a missing plan produces no claim", () => {
  assert.equal(yearlySavingPercent(null, usd(2900)), null);
  assert.equal(yearlySavingPercent(usd(600), null), null);
  assert.equal(yearlySavingPercent(null, null), null);
});

test("unusable numbers produce no claim", () => {
  assert.equal(yearlySavingPercent(usd(0), usd(2900)), null, "a free monthly plan has no basis to compare");
  assert.equal(yearlySavingPercent(usd(Number.NaN), usd(2900)), null);
  assert.equal(yearlySavingPercent(usd(600), usd(Number.POSITIVE_INFINITY)), null);
  assert.equal(yearlySavingPercent(usd(-600), usd(2900)), null);
});

test("a saving that rounds below one percent is not shown", () => {
  // $100/month = $1200. $1199 is 0.08% - a badge would be noise.
  assert.equal(yearlySavingPercent(usd(10000), usd(119900)), null);
});

test("a free yearly plan is a full saving, not an error", () => {
  assert.equal(yearlySavingPercent(usd(600), usd(0)), 100);
});
