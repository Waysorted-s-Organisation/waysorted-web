import PricingClient from "./pricing-client";

/**
 * This shell is intentionally STATIC.
 *
 * It renders no request-specific data: prices are fetched client-side from
 * /api/billing/public-catalog, which is itself `force-dynamic` + `no-store` and resolves the
 * visitor's region per request. The HTML is therefore identical for every visitor.
 *
 * It previously carried `dynamic = "force-dynamic"` alongside a loader that returned nulls, which
 * forced a serverless render on every single request for that identical markup - so every visitor
 * paid function invocation latency, and a cold start cost over a second of TTFB.
 *
 * If regional pricing is ever moved into the server render, this MUST become dynamic again -
 * otherwise one visitor's cached prices would be served to everyone.
 */
export default function PricingPage() {
  return <PricingClient initialPricingData={null} initialPricingError={null} />;
}
