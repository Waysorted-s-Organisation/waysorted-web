import PricingClient, { type PricingPayload } from "./pricing-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function loadInitialPricing(): Promise<{
  initialPricingData: PricingPayload | null;
  initialPricingError: string | null;
}> {
  return {
    initialPricingData: null,
    initialPricingError: null,
  };
}

export default async function PricingPage() {
  const { initialPricingData, initialPricingError } = await loadInitialPricing();

  return <PricingClient initialPricingData={initialPricingData} initialPricingError={initialPricingError} />;
}
