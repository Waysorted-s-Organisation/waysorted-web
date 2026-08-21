import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildPublicCatalog } from "../lib/billing/public-catalog";
import { getVisibleCatalog } from "../lib/billing/catalog";

test("the server-rendered public catalog matches the public pricing contract", () => {
  const payload = buildPublicCatalog(new Headers({ "x-vercel-ip-country": "IN" }));

  assert.equal(payload.pricing.country, "IN");
  assert.equal(payload.pricing.currency, "INR");
  assert.equal(
    payload.catalog.filter((product) => product.kind === "subscription" && product.billingCycle === "monthly").length,
    3,
  );
  // Starter packs are gated on being a new user, which this endpoint cannot know.
  assert.ok(payload.catalog.every((product) => product.kind !== "starter"));
});

test("subscriber top-ups are published for comparison, and flagged as such", () => {
  const payload = buildPublicCatalog(new Headers({ "x-vercel-ip-country": "IN" }));
  const subscriberOnly = payload.catalog.filter((product) => product.eligibility === "subscriber");

  // /pricing compares the two top-up tiers; it cannot draw the subscriber rung
  // without its credit figures.
  assert.ok(subscriberOnly.length > 0, "subscriber top-ups should be visible");
  assert.ok(
    subscriberOnly.every((product) => product.requiresSubscription === true),
    "every subscriber-only product must carry requiresSubscription",
  );
  assert.ok(
    payload.catalog
      .filter((product) => product.eligibility !== "subscriber")
      .every((product) => product.requiresSubscription === false),
    "nothing else may claim to require a subscription",
  );
});

test("publishing them does not make them buyable", () => {
  /*
   * The flag is decoration. What actually stops a non-subscriber is
   * getVisibleCatalog, which checkout enforces with - so it must still refuse
   * every subscriber-only product for someone without an active subscription,
   * no matter what the public catalog says.
   */
  const visible = getVisibleCatalog({ isNewUser: false, hasActiveSubscription: false });
  assert.ok(
    visible.every((product) => product.eligibility !== "subscriber"),
    "a non-subscriber must not be offered a subscriber-only product",
  );

  const subscriberView = getVisibleCatalog({ isNewUser: false, hasActiveSubscription: true });
  assert.ok(
    subscriberView.some((product) => product.eligibility === "subscriber"),
    "a subscriber should see the subscriber tier",
  );
});

test("the pricing page refuses to hand off a product it knows is locked", () => {
  // Belt to the CTA's braces: even if the button were mis-rendered, the
  // navigation itself checks before sending anyone to /billing.
  const source = readFileSync(new URL("../app/pricing/pricing-client.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /if \(requested\?\.requiresSubscription && !\(purchasableCodes \?\? \[\]\)\.includes\(productCode\)\) return;/,
  );
});
