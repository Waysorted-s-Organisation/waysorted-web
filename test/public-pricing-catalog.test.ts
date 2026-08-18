import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicCatalog } from "../lib/billing/public-catalog";

test("the server-rendered public catalog matches the public pricing contract", () => {
  const payload = buildPublicCatalog(new Headers({ "x-vercel-ip-country": "IN" }));

  assert.equal(payload.pricing.country, "IN");
  assert.equal(payload.pricing.currency, "INR");
  assert.equal(
    payload.catalog.filter((product) => product.kind === "subscription" && product.billingCycle === "monthly").length,
    3,
  );
  assert.ok(payload.catalog.every((product) => product.kind !== "starter"));
  assert.ok(payload.catalog.every((product) => product.eligibility !== "subscriber"));
});
