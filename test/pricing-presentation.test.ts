import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  getCreditPresentation,
  getMinimumAnnualSavingsPercent,
  getPlanUi,
} from "../app/pricing/pricing-presentation";
import { CATALOG_PRODUCTS } from "../lib/billing/catalog";

test("subscription credit labels use the granted catalog values", () => {
  assert.deepEqual(getCreditPresentation({
    code: "sub_month_1",
    priceInr: 149,
    creditsGranted: 150,
    bonusCredits: 0,
    billingCycle: "monthly",
  }), {
    creditsLabel: "150 credits/month",
    bonusCreditsLabel: undefined,
  });

  assert.deepEqual(getCreditPresentation({
    code: "sub_year_7499",
    priceInr: 7499,
    creditsGranted: 14_400,
    bonusCredits: 0,
    billingCycle: "yearly",
  }), {
    creditsLabel: "14,400 credits/year",
    bonusCreditsLabel: undefined,
  });
});

test("a real catalog bonus is shown instead of invented plan copy", () => {
  assert.deepEqual(getCreditPresentation({
    code: "starter_149",
    priceInr: 149,
    creditsGranted: 200,
    bonusCredits: 25,
    billingCycle: "one_time",
  }), {
    creditsLabel: "225 credits/purchase",
    bonusCreditsLabel: "Includes 25 bonus credits",
  });
});

test("a subscription's bonus is never folded into the per-period figure", () => {
  // The bonus lands once, on the first purchase of the plan. "175 credits/month" would
  // promise it every month, which is the reading applySubscriptionCycleCredits refuses.
  assert.deepEqual(getCreditPresentation({
    code: "sub_month_1",
    priceInr: 149,
    creditsGranted: 150,
    bonusCredits: 25,
    billingCycle: "monthly",
  }), {
    creditsLabel: "150 credits/month",
    bonusCreditsLabel: "Plus 25 bonus credits for new users",
  });
});

test("every active monthly plan carries the bonus the pricing design shows", () => {
  const expected: Record<string, number> = {
    sub_month_1: 25,
    sub_month_2: 50,
    sub_month_3: 100,
  };
  for (const [code, bonus] of Object.entries(expected)) {
    const product = CATALOG_PRODUCTS.find((p) => p.code === code);
    assert.ok(product, `${code} missing from the catalog`);
    assert.equal(product.bonusCredits, bonus, `${code} bonus drifted from the design`);
  }
});

test("a subscription bonus is keyed per plan, not per subscription", () => {
  // Cancelling and resubscribing mints a new subscription id. Keying the ledger row on
  // it would re-issue the welcome bonus every time someone churned and came back.
  const source = readFileSync(
    new URL("../lib/billing/db.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /subscription-plan-bonus:\$\{existingSubscription\.user\}:\$\{existingSubscription\.planCode\}/,
  );
  // The cycle grant must not carry the bonus, or it would repeat monthly.
  assert.doesNotMatch(
    source,
    /const totalGranted = product\.creditsGranted \+ product\.bonusCredits;/,
  );
});

test("plan presentation is keyed by code, not catalog array position", () => {
  assert.equal(getPlanUi("sub_month_2")?.planName, "Core");
  assert.equal(getPlanUi("sub_year_1599")?.planName, "Discover");
  assert.equal(getPlanUi("unknown"), null);
});

test("yearly savings is calculated from catalog prices", () => {
  const monthly = [
    { code: "sub_month_1", priceInr: 149, creditsGranted: 150, bonusCredits: 0, billingCycle: "monthly" as const },
    { code: "sub_month_2", priceInr: 349, creditsGranted: 550, bonusCredits: 0, billingCycle: "monthly" as const },
    { code: "sub_month_3", priceInr: 749, creditsGranted: 1500, bonusCredits: 0, billingCycle: "monthly" as const },
  ];
  const yearly = [
    { code: "sub_year_1599", priceInr: 1499, creditsGranted: 2400, bonusCredits: 0, billingCycle: "yearly" as const },
    { code: "sub_year_3499", priceInr: 3499, creditsGranted: 6000, bonusCredits: 0, billingCycle: "yearly" as const },
    { code: "sub_year_7499", priceInr: 7499, creditsGranted: 14400, bonusCredits: 0, billingCycle: "yearly" as const },
  ];

  assert.equal(getMinimumAnnualSavingsPercent(monthly, yearly), 16);
});

test("the plan bonus is decided by a read, never by catching a duplicate key", () => {
  /*
   * A duplicate key inside a MongoDB transaction aborts it server-side. Catching
   * the E11000 and continuing to write leaves every later statement failing with
   * NoSuchTransaction, which carries the TransientTransactionError label, so
   * withTransaction retries the whole callback in a hot loop until its 120s
   * deadline and then throws. That turned the SECOND cycle of every monthly
   * subscription into a two-minute hang that granted nothing at all.
   *
   * The exactly-once guard has to be a read.
   */
  const source = readFileSync(new URL("../lib/billing/db.ts", import.meta.url), "utf8");
  const cycleFn = source.slice(source.indexOf("export async function applySubscriptionCycleCredits"));
  const body = cycleFn.slice(0, cycleFn.indexOf("\nexport async function "));

  assert.match(body, /CreditLedger\.exists\(\{ idempotencyKey: planBonusKey \}\)/);
  assert.doesNotMatch(
    body.slice(body.indexOf("planBonusKey")),
    /code !== 11000/,
    "the plan-bonus insert must not swallow a duplicate key mid-transaction",
  );
});

test("a subscription purchase row carries no bonus to refund", () => {
  // The cycle path grants the bonus, once per (user, plan), reading the catalog.
  // Copying it onto the Purchase row made recordRefundAdjustment reverse credits
  // that purchase had never granted.
  const source = readFileSync(new URL("../lib/billing/db.ts", import.meta.url), "utf8");
  assert.match(
    source,
    /bonusCredits: product\.kind === "subscription" \? 0 : product\.bonusCredits,/,
  );
});
