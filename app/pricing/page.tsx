import type { Metadata } from "next";
import PricingClient, { type PricingPayload } from "./pricing-client";

// Title and description are set explicitly: with only a canonical here the page
// inherited the root layout's homepage title AND description verbatim, so /
// and /pricing were served as duplicates of each other.
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Waysorted pricing: start free, then pay as you go with credits or upgrade to Pro. One plan covers every tool in the suite - no separate subscription per plugin.",
  alternates: {
    canonical: "https://www.waysorted.com/pricing",
  },
  openGraph: {
    title: "Pricing | Waysorted",
    description:
      "Start free, then pay as you go with credits or upgrade to Pro. One plan covers every tool in the Waysorted suite.",
    url: "https://www.waysorted.com/pricing",
    siteName: "Waysorted",
    type: "website",
  },
};

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
