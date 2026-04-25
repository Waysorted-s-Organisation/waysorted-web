import { NextRequest, NextResponse } from "next/server";
import { BILLING_PRICING_VERSION, CATALOG_PRODUCTS } from "@/lib/billing/catalog";
import {
  applyRegionalPrice,
  createPricingContext,
  getCountryFromRequest,
} from "@/lib/billing/regional-pricing";

export async function GET(request: NextRequest) {
  const pricing = createPricingContext({
    detectedCountry: getCountryFromRequest(request),
  });

  const catalog = CATALOG_PRODUCTS.filter(
    (product) => product.active && product.kind !== "starter",
  ).map((product) => applyRegionalPrice(product, pricing));

  return NextResponse.json(
    {
      pricingVersion: BILLING_PRICING_VERSION,
      pricing,
      catalog,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
