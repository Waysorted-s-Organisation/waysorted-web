import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TRUSTED_GEO_HEADER,
  getTrustedPricingCountry,
  isEdgeAttested,
} from "../lib/billing/regional-pricing";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

const PROD = { nodeEnv: "production" } as const;

/**
 * A proxy geo header is only evidence when the request proves it came through our edge. The origin
 * is directly reachable, so any rule that lets an unattested request pick a country is a
 * self-service discount.
 */

test("a non-platform geo header is ignored when no attestation secret is configured", () => {
  // Half-applied cutover: BILLING_TRUSTED_GEO_HEADER switched but the secret never set.
  assert.equal(
    getTrustedPricingCountry(headers({ "cf-ipcountry": "IN" }), {
      ...PROD,
      trustedHeader: "cf-ipcountry",
      attestationSecret: null,
    }),
    null,
  );
});

test("a blank or whitespace secret does not count as configured", () => {
  for (const secret of ["", "   "]) {
    assert.equal(
      isEdgeAttested(headers({ "cf-ipcountry": "IN" }), {
        secret,
        trustedHeader: "cf-ipcountry",
      }),
      false,
      `secret ${JSON.stringify(secret)} must not enable the proxy header`,
    );
  }
});

test("the platform's own header still works without an attestation secret", () => {
  assert.equal(
    getTrustedPricingCountry(headers({ [DEFAULT_TRUSTED_GEO_HEADER]: "IN" }), {
      ...PROD,
      attestationSecret: null,
    }),
    "IN",
  );
});

test("an invalid configured header name degrades instead of throwing", () => {
  // Headers.get throws a TypeError on an invalid name; a typo in the env var must not 500 the
  // entire pricing and checkout surface.
  assert.doesNotThrow(() => {
    getTrustedPricingCountry(headers({ "cf-ipcountry": "IN" }), {
      ...PROD,
      trustedHeader: "not a valid header name",
      attestationSecret: "s3cret",
    });
  });
  assert.equal(
    getTrustedPricingCountry(headers({ "cf-ipcountry": "IN" }), {
      ...PROD,
      trustedHeader: "not a valid header name",
      attestationSecret: "s3cret",
    }),
    null,
  );
});

test("an invalid attestation header name degrades instead of throwing", () => {
  assert.doesNotThrow(() => {
    isEdgeAttested(headers(), {
      secret: "s3cret",
      headerName: "bad header{name}",
      trustedHeader: "cf-ipcountry",
    });
  });
});
