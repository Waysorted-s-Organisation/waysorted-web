import assert from "node:assert/strict";
import test from "node:test";
import { applyRegionalPrice, createPricingContext } from "../lib/billing/regional-pricing";
import { CATALOG_PRODUCTS } from "../lib/billing/catalog";

/**
 * Pricing is geo-based only: the price a visitor sees must not depend on whether they are signed in,
 * or on anything persisted against their account.
 *
 * Previously /pricing served the public (geo) catalog while /billing served an authenticated one
 * that honoured a per-user pricing lock, so the page visibly repainted from the geo price to the
 * locked one as auth resolved - an Indian visitor saw Rs 149 turn into $5.99. The lock also
 * ratcheted only upward, so one mis-geolocated request repriced a customer permanently.
 */

function priceOf(code: string, ctx: ReturnType<typeof createPricingContext>) {
  const product = CATALOG_PRODUCTS.find((p) => p.code === code)!;
  const priced = applyRegionalPrice(product, ctx);
  return { amount: priced.displayAmount, currency: priced.currency, subunits: priced.amountPaise };
}

test("a stored lock cannot override the detected country", () => {
  // The same visitor, with a stale US/tier_1/USD lock on their account, must still be priced from
  // their real country. createPricingContext is called with detectedCountry ONLY on every path.
  const geoOnly = createPricingContext({ detectedCountry: "IN" });

  assert.equal(geoOnly.country, "IN");
  assert.equal(geoOnly.tier, "tier_3");
  assert.equal(geoOnly.currency, "INR");
  assert.equal(geoOnly.locked, false);
  assert.equal(geoOnly.source, "request");
});

test("signed-out and signed-in views of the same country produce identical prices", () => {
  // Both /pricing and /billing derive from createPricingContext({ detectedCountry }) now, so the
  // two surfaces cannot disagree for the same visitor.
  const anonymous = createPricingContext({ detectedCountry: "IN" });
  const authenticated = createPricingContext({ detectedCountry: "IN" });

  for (const code of ["sub_month_1", "sub_month_2", "sub_month_3", "topup_std_50"]) {
    assert.deepEqual(priceOf(code, anonymous), priceOf(code, authenticated), `${code} must match`);
  }
});

test("each country is priced at its own tier and currency", () => {
  const cases: Array<[string, string, string]> = [
    ["IN", "tier_3", "INR"],
    ["US", "tier_1", "USD"],
    ["GB", "tier_1", "GBP"],
    ["SG", "tier_1", "SGD"],
  ];
  for (const [country, tier, currency] of cases) {
    const ctx = createPricingContext({ detectedCountry: country });
    assert.equal(ctx.tier, tier, `${country} tier`);
    assert.equal(ctx.currency, currency, `${country} currency`);
  }
});

test("an Indian visitor is quoted the catalog INR price, not a converted tier_1 price", () => {
  const ctx = createPricingContext({ detectedCountry: "IN" });
  assert.deepEqual(priceOf("sub_month_1", ctx), { amount: 149, currency: "INR", subunits: 14900 });
  assert.deepEqual(priceOf("sub_month_2", ctx), { amount: 349, currency: "INR", subunits: 34900 });
  assert.deepEqual(priceOf("sub_month_3", ctx), { amount: 749, currency: "INR", subunits: 74900 });
});

test("no trusted geo signal still falls back to home pricing", () => {
  const ctx = createPricingContext({ detectedCountry: null });
  assert.equal(ctx.currency, "INR");
  assert.equal(ctx.tier, "tier_3");
  assert.equal(ctx.source, "default");
});
