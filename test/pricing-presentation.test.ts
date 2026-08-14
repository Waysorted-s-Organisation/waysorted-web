import assert from "node:assert/strict";
import test from "node:test";
import {
  getCreditPresentation,
  getMinimumAnnualSavingsPercent,
  getPlanUi,
} from "../app/pricing/pricing-presentation";

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
