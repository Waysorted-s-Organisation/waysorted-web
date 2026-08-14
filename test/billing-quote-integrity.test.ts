import assert from "node:assert/strict";
import test from "node:test";
import { CATALOG_PRODUCTS } from "../lib/billing/catalog";
import { applyRegionalPrice, createPricingContext } from "../lib/billing/regional-pricing";

/**
 * The customer must never be charged an amount they were not shown.
 *
 * /pricing can serve the unauthenticated catalog (detected country, no pricing lock) while /billing
 * prices from the authenticated snapshot (which honours the lock), so the two legitimately disagree
 * for a locked user. These cases pin the size of that gap and the rule used to detect it, so a
 * future change cannot quietly reintroduce a silent reprice.
 */

const MONTHLY = CATALOG_PRODUCTS.filter((p) =>
  ["sub_month_1", "sub_month_2", "sub_month_3"].includes(p.code),
);

function priceFor(code: string, pricing: ReturnType<typeof createPricingContext>) {
  const product = CATALOG_PRODUCTS.find((p) => p.code === code)!;
  return applyRegionalPrice(product, pricing);
}

/** Mirrors the drift rule in app/billing/billing-client.tsx. */
function hasQuoteDrift(
  quoted: { amountPaise: number; currency: string },
  current: { amountPaise: number; currency: string },
) {
  return (
    quoted.amountPaise !== current.amountPaise ||
    quoted.currency.toUpperCase() !== current.currency.toUpperCase()
  );
}

test("an unlocked Indian view and a US-locked account produce a detectable drift", () => {
  // Exactly the reported scenario: /pricing shows the tier_3 INR price while the account is locked
  // to US/tier_1/USD, so checkout would otherwise open Razorpay at a tripled amount.
  const shown = priceFor("sub_month_2", createPricingContext({ detectedCountry: "IN" }));
  const charged = priceFor(
    "sub_month_2",
    createPricingContext({
      detectedCountry: "IN",
      lockedCountry: "US",
      lockedTier: "tier_1",
      lockedCurrency: "USD",
    }),
  );

  assert.equal(shown.currency, "INR");
  assert.equal(shown.displayAmount, 349);
  assert.equal(charged.currency, "USD");
  assert.equal(charged.displayAmount, 11.99);
  assert.equal(hasQuoteDrift(shown, charged), true);
});

test("no drift is reported when the shown and charged prices agree", () => {
  const pricing = createPricingContext({ detectedCountry: "IN" });
  for (const product of MONTHLY) {
    const priced = applyRegionalPrice(product, pricing);
    assert.equal(hasQuoteDrift(priced, priced), false);
  }
});

test("a currency change alone counts as drift even at an equal numeric amount", () => {
  assert.equal(
    hasQuoteDrift({ amountPaise: 34900, currency: "INR" }, { amountPaise: 34900, currency: "USD" }),
    true,
  );
});

test("tier_1 costs materially more than tier_3 for identical credits", () => {
  // Documents the intended regional spread. If this ratio ever changes, the drift-confirmation UX
  // and the lock rules both need revisiting.
  const tier3 = priceFor("sub_month_1", createPricingContext({ detectedCountry: "IN" }));
  const tier1 = priceFor("sub_month_1", createPricingContext({ detectedCountry: "US" }));

  assert.equal(tier3.creditsGranted, tier1.creditsGranted);
  assert.equal(tier3.basePriceInr, 149);
  assert.equal(tier1.basePriceInr, 499);
  assert.ok(tier1.basePriceInr / tier3.basePriceInr > 3);
});

test("every active catalog product prices without NaN or fractional subunits in each tier", () => {
  for (const country of ["IN", "US", "GB", "AE", "SG"]) {
    const pricing = createPricingContext({ detectedCountry: country });
    for (const product of CATALOG_PRODUCTS.filter((p) => p.active)) {
      const priced = applyRegionalPrice(product, pricing);
      assert.ok(
        Number.isSafeInteger(priced.amountPaise),
        `${product.code} in ${country} produced non-integer subunits: ${priced.amountPaise}`,
      );
      assert.ok(
        priced.amountPaise > 0,
        `${product.code} in ${country} produced a non-positive charge`,
      );
      assert.ok(
        Number.isFinite(priced.displayAmount),
        `${product.code} in ${country} produced a non-finite display amount`,
      );
    }
  }
});
