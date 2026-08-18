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

  const catalog = CATALOG_PRODUCTS.filter(
    (product) =>
      product.active &&
      product.kind !== "starter" &&
      product.eligibility !== "subscriber",
  ).map((product) => applyRegionalPrice(product, pricing));

  return {
    pricingVersion: BILLING_PRICING_VERSION,
    pricing,
    catalog,
  };
}
