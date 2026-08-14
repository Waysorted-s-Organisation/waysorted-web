import assert from "node:assert/strict";
import test from "node:test";
import {
  createPricingContext,
  getDefaultPricingCountry,
  getTrustedPricingCountry,
  normalizeCountry,
  parseCountryCode,
  applyRegionalPrice,
  DEFAULT_PRICING_COUNTRY_FALLBACK,
} from "../lib/billing/regional-pricing";
import { CATALOG_PRODUCTS } from "../lib/billing/catalog";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

/**
 * Regression: with no trusted geo header the pricing context used to resolve to US / tier_1 / USD,
 * so an Indian visitor was quoted $5.99/$11.99/$24.00 instead of the tier_3 INR prices, in a
 * currency the INR Razorpay account may not settle.
 */
test("no geo signal falls back to INR pricing, not USD", () => {
  const pricing = createPricingContext({ detectedCountry: null });

  assert.equal(pricing.currency, "INR");
  assert.equal(pricing.country, DEFAULT_PRICING_COUNTRY_FALLBACK);
  assert.equal(pricing.tier, "tier_3");
  assert.equal(pricing.source, "default");
  assert.ok(pricing.riskFlags.includes("missing_country_default_pricing"));
});

test("fallback pricing quotes the catalog INR price for monthly plans", () => {
  const pricing = createPricingContext({ detectedCountry: null });
  const monthly = CATALOG_PRODUCTS.filter((product) =>
    ["sub_month_1", "sub_month_2", "sub_month_3"].includes(product.code),
  );
  assert.equal(monthly.length, 3);

  for (const product of monthly) {
    const priced = applyRegionalPrice(product, pricing);
    assert.equal(priced.currency, "INR");
    // tier_3 is the catalog base price; anything else means the visitor was promoted a tier.
    assert.equal(priced.displayAmount, product.priceInr);
  }
});

test("a detected tier_1 country still gets tier_1 pricing in its own currency", () => {
  const pricing = createPricingContext({ detectedCountry: "US" });
  assert.equal(pricing.currency, "USD");
  assert.equal(pricing.tier, "tier_1");
  assert.equal(pricing.source, "request");
});

test("a detected Indian request gets tier_3 INR pricing", () => {
  const pricing = createPricingContext({ detectedCountry: "IN" });
  assert.equal(pricing.currency, "INR");
  assert.equal(pricing.tier, "tier_3");
  assert.equal(pricing.source, "request");
});

test("free-text country names are not silently coerced to US", () => {
  assert.equal(parseCountryCode("India"), null);
  assert.equal(parseCountryCode("United States"), null);
  assert.equal(parseCountryCode(""), null);
  assert.equal(parseCountryCode(null), null);
  assert.equal(parseCountryCode("in"), "IN");
  assert.equal(parseCountryCode(" us "), "US");

  // normalizeCountry still returns a usable code, but the deployment default - never a
  // hardcoded tier_1 country that would silently triple an Indian customer's price.
  assert.equal(normalizeCountry("India"), getDefaultPricingCountry());
  assert.notEqual(normalizeCountry("India"), "US");
});

test("the trusted geo header is configurable for non-Vercel deployments", () => {
  assert.equal(
    getTrustedPricingCountry(headers({ "x-geo-country": "IN" }), {
      nodeEnv: "production",
      trustedHeader: "x-geo-country",
    }),
    "IN",
  );
});

test("a caller-supplied Cloudflare header is still ignored when it is not the trusted header", () => {
  // Trusting an arbitrary client-settable header would let any visitor choose their own price tier.
  assert.equal(
    getTrustedPricingCountry(headers({ "cf-ipcountry": "IN" }), {
      nodeEnv: "production",
      trustedHeader: "x-vercel-ip-country",
    }),
    null,
  );
});

test("an existing lock is still honoured over the fallback", () => {
  const pricing = createPricingContext({
    detectedCountry: null,
    lockedCountry: "US",
    lockedTier: "tier_1",
    lockedCurrency: "USD",
  });
  assert.equal(pricing.currency, "USD");
  assert.equal(pricing.source, "existing_lock");
});
