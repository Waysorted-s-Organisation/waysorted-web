import assert from "node:assert/strict";
import test from "node:test";
import {
  getTrustedPricingCountry,
  isEdgeAttested,
  createPricingContext,
} from "../lib/billing/regional-pricing";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

const SECRET = "edge-proof-secret-value";
const PROD = { nodeEnv: "production" } as const;

/**
 * waysorted.com is proxied by Cloudflare, so Vercel terminates the connection with Cloudflare's
 * address and `x-vercel-ip-country` reports the Cloudflare PoP's country - Indian visitors routed
 * through the Singapore colo were reported as SG and quoted tier_1 SGD. The proxy's own header
 * (`cf-ipcountry`) carries the real visitor country, but the origin stays directly reachable, so it
 * is only evidence when the request also proves it came through our edge.
 */

test("a proxy geo header is honoured when the edge attestation matches", () => {
  assert.equal(
    getTrustedPricingCountry(
      headers({ "cf-ipcountry": "IN", "x-waysorted-edge-proof": SECRET }),
      { ...PROD, trustedHeader: "cf-ipcountry", attestationSecret: SECRET },
    ),
    "IN",
  );
});

test("a direct-to-origin caller cannot pick their own tier by forging the geo header", () => {
  // Bypassing the proxy and sending cf-ipcountry directly must NOT select the cheapest tier.
  assert.equal(
    getTrustedPricingCountry(headers({ "cf-ipcountry": "IN" }), {
      ...PROD,
      trustedHeader: "cf-ipcountry",
      attestationSecret: SECRET,
    }),
    null,
  );
});

test("a wrong attestation value is rejected", () => {
  assert.equal(
    getTrustedPricingCountry(
      headers({ "cf-ipcountry": "IN", "x-waysorted-edge-proof": "not-the-secret" }),
      { ...PROD, trustedHeader: "cf-ipcountry", attestationSecret: SECRET },
    ),
    null,
  );
});

test("an unattested request falls back to home pricing, never to a caller-chosen tier", () => {
  const detected = getTrustedPricingCountry(headers({ "cf-ipcountry": "US" }), {
    ...PROD,
    trustedHeader: "cf-ipcountry",
    attestationSecret: SECRET,
  });
  const pricing = createPricingContext({ detectedCountry: detected });
  assert.equal(detected, null);
  assert.equal(pricing.currency, "INR");
  assert.equal(pricing.source, "default");
});

test("attestation is skipped when no secret is configured, preserving platform-header behaviour", () => {
  assert.equal(isEdgeAttested(headers(), { secret: null }), true);
  assert.equal(
    getTrustedPricingCountry(headers({ "x-vercel-ip-country": "IN" }), {
      ...PROD,
      attestationSecret: null,
    }),
    "IN",
  );
});

test("the attestation header name is configurable", () => {
  assert.equal(
    isEdgeAttested(headers({ "x-custom-proof": SECRET }), {
      secret: SECRET,
      headerName: "x-custom-proof",
    }),
    true,
  );
  assert.equal(
    isEdgeAttested(headers({ "x-waysorted-edge-proof": SECRET }), {
      secret: SECRET,
      headerName: "x-custom-proof",
    }),
    false,
  );
});

test("an attested Indian visitor is priced in INR at tier_3", () => {
  const detected = getTrustedPricingCountry(
    headers({ "cf-ipcountry": "IN", "x-waysorted-edge-proof": SECRET }),
    { ...PROD, trustedHeader: "cf-ipcountry", attestationSecret: SECRET },
  );
  const pricing = createPricingContext({ detectedCountry: detected });
  assert.equal(pricing.country, "IN");
  assert.equal(pricing.tier, "tier_3");
  assert.equal(pricing.currency, "INR");
  assert.equal(pricing.source, "request");
});
