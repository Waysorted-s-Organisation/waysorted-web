import assert from "node:assert/strict";
import test from "node:test";
import AttributionCampaign from "../models/attributionCampaign";
import {
  buildAttributionCampaignUrl,
  normalizeAttributionCampaignInput,
  slugifyAttributionValue,
} from "../lib/attribution-campaigns";

test("campaign names produce stable lowercase UTM values", () => {
  assert.equal(slugifyAttributionValue("  Madhura Partner  "), "madhura_partner");
});

test("campaign input defaults to a referral checkout link", () => {
  assert.deepEqual(normalizeAttributionCampaignInput({ name: "Madhura" }), {
    name: "Madhura",
    utmSource: "madhura",
    utmMedium: "referral",
    utmCampaign: "checkout",
    destinationPath: "/payment",
  });
});

test("generated links preserve destination parameters and add UTM values", () => {
  const url = new URL(buildAttributionCampaignUrl("https://www.waysorted.com", {
    destinationPath: "/payment?product=starter",
    utmSource: "madhura",
    utmMedium: "referral",
    utmCampaign: "checkout",
  }));
  assert.equal(url.origin, "https://www.waysorted.com");
  assert.equal(url.pathname, "/payment");
  assert.equal(url.searchParams.get("product"), "starter");
  assert.equal(url.searchParams.get("utm_source"), "madhura");
});

test("campaign destinations cannot leave the Waysorted origin", () => {
  assert.throws(
    () => normalizeAttributionCampaignInput({ name: "Madhura", destinationPath: "https://example.com" }),
    /Destination/,
  );
  assert.throws(
    () => normalizeAttributionCampaignInput({ name: "Madhura", destinationPath: "//example.com" }),
    /Destination/,
  );
});

test("source and campaign identity is unique", () => {
  assert.ok(AttributionCampaign.schema.indexes().some(([fields, options]) =>
    fields.utmSource === 1 &&
    fields.utmCampaign === 1 &&
    options.unique === true,
  ));
});
