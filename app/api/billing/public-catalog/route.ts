import { NextRequest, NextResponse } from "next/server";
import { BILLING_PRICING_VERSION, CATALOG_PRODUCTS } from "@/lib/billing/catalog";
import {
  applyRegionalPrice,
  createPricingContext,
  getCountryFromRequest,
} from "@/lib/billing/regional-pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
        "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    },
  );
}
