import assert from "node:assert/strict";
import test from "node:test";
import {
  getPricingCountryMismatchRiskFlags,
  getSafestObservedCountry,
  getTrustedPricingCountry,
} from "../lib/billing/regional-pricing";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

test("production trusts the Vercel country header", () => {
  assert.equal(
    getTrustedPricingCountry(headers({ "x-vercel-ip-country": "in" }), { nodeEnv: "production" }),
    "IN",
  );
});

test("production ignores a caller-supplied Cloudflare country header", () => {
  assert.equal(
    getTrustedPricingCountry(headers({ "cf-ipcountry": "IN" }), { nodeEnv: "production" }),
    null,
  );
});

test("development uses only the explicit pricing-country override", () => {
  assert.equal(
    getTrustedPricingCountry(headers({ "cf-ipcountry": "US" }), {
      nodeEnv: "development",
      developmentOverride: "in",
    }),
    "IN",
  );
  assert.equal(
    getTrustedPricingCountry(headers(), { nodeEnv: "development", developmentOverride: null }),
    null,
  );
});

test("historical auth country cannot supply a cheaper country without a trusted request", () => {
  assert.equal(getSafestObservedCountry(null, "IN"), null);
  assert.equal(getSafestObservedCountry("US", "IN"), "US");
  assert.equal(getSafestObservedCountry("IN", "US"), "US");
});

test("country disagreements produce explicit risk flags", () => {
  assert.deepEqual(
    getPricingCountryMismatchRiskFlags({
      authCountry: "IN",
      trustedRequestCountry: "US",
      declaredBillingCountry: "GB",
      lockedPricingCountry: "US",
    }),
    [
      "auth_country_differs_from_checkout_country",
      "billing_country_differs_from_pricing_country",
    ],
  );
});
