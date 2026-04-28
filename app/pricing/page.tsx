import { cookies, headers } from "next/headers";
import PricingClient, { type PricingPayload } from "./pricing-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function loadInitialPricing(): Promise<{
  initialPricingData: PricingPayload | null;
  initialPricingError: string | null;
}> {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") || "https";

    if (!host) {
      return {
        initialPricingData: null,
        initialPricingError: "Unable to resolve pricing right now.",
      };
    }

    const baseUrl = `${protocol}://${host}`;
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
    const forwardedCountry = headerStore.get("cf-ipcountry") || headerStore.get("x-vercel-ip-country") || "";
    const requestHeaders: Record<string, string> = {
      "x-vercel-ip-country": forwardedCountry,
      "cf-ipcountry": forwardedCountry,
    };

    if (cookieHeader) {
      requestHeaders.cookie = cookieHeader;
    }

    const response = await fetch(`${baseUrl}/api/billing/public-catalog?ts=${Date.now()}`, {
      headers: requestHeaders,
      cache: "no-store",
    });

    const payload = (await response.json()) as PricingPayload | { error?: string };
    if (!response.ok || !("catalog" in payload)) {
      throw new Error(("error" in payload && payload.error) || "Unable to load pricing.");
    }

    if (payload.pricing.source === "default" || payload.pricing.riskFlags.includes("missing_country_default_tier_1")) {
      return {
        initialPricingData: null,
        initialPricingError: null,
      };
    }

    return {
      initialPricingData: payload,
      initialPricingError: null,
    };
  } catch (error) {
    return {
      initialPricingData: null,
      initialPricingError: error instanceof Error ? error.message : "Unable to load pricing.",
    };
  }
}

export default async function PricingPage() {
  const { initialPricingData, initialPricingError } = await loadInitialPricing();

  return <PricingClient initialPricingData={initialPricingData} initialPricingError={initialPricingError} />;
}
