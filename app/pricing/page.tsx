import PricingClient, { type PricingPayload } from "./pricing-client";
import { headers } from "next/headers";
import { buildPublicCatalog } from "@/lib/billing/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function loadInitialPricing(): Promise<{
  initialPricingData: PricingPayload | null;
  initialPricingError: string | null;
}> {
  try {
    const requestHeaders = await headers();
    return {
      initialPricingData: buildPublicCatalog(requestHeaders),
      initialPricingError: null,
    };
  } catch (error) {
    console.error("[pricing] failed to build the initial public catalog", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return {
      initialPricingData: null,
      initialPricingError: "Unable to load pricing.",
    };
  }
}

export default async function PricingPage() {
  const { initialPricingData, initialPricingError } = await loadInitialPricing();

  return <PricingClient initialPricingData={initialPricingData} initialPricingError={initialPricingError} />;
}
