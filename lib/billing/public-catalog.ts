import { BILLING_PRICING_VERSION, CATALOG_PRODUCTS } from "@/lib/billing/catalog";
import {
  applyRegionalPrice,
  createPricingContext,
  getTrustedPricingCountry,
} from "@/lib/billing/regional-pricing";

/**
 * Build the public catalog from the request headers at the edge/server.
 *
 * Keeping this shared between the page and API prevents the initial HTML from
 * showing an empty pricing grid and then shifting after a client-side request.
 */
export function buildPublicCatalog(headers: Pick<Headers, "get">) {
  const pricing = createPricingContext({
    detectedCountry: getTrustedPricingCountry(headers),
  });

  /*
   * Subscriber top-ups ARE included, flagged rather than filtered.
   *
   * /pricing compares the two top-up tiers side by side, and it cannot draw the
   * subscriber rung without its credit figures. Hiding the products meant the
   * comparison toggle had nothing to switch to, so it silently did nothing.
   *
   * `requiresSubscription` is a DISPLAY flag and nothing more. It is not what
   * stops a non-subscriber buying one: `getVisibleCatalog` decides that
   * server-side at checkout, and still refuses regardless of anything sent from
   * here. Starter packs stay out entirely - they are gated on being a new user,
   * which this endpoint has no way to know.
   */
  const catalog = CATALOG_PRODUCTS.filter(
    (product) => product.active && product.kind !== "starter",
  ).map((product) => ({
    ...applyRegionalPrice(product, pricing),
    requiresSubscription: product.eligibility === "subscriber",
  }));

  return {
    pricingVersion: BILLING_PRICING_VERSION,
    pricing,
    catalog,
  };
}
