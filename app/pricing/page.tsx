import PricingClient from "./pricing-client";

/**
 * This shell is intentionally static.
 *
 * Regional prices are fetched per visitor from the dynamic, no-store public catalog API. The
 * client keeps fixed-size pricing placeholders in the initial HTML, so the cards can arrive
 * without shifting the page while this route avoids a serverless cold start on every visit.
 *
 * If regional pricing is moved back into the server render, this page must become dynamic again;
 * otherwise one visitor's cached prices could be served to everyone.
 */
export default function PricingPage() {
  return <PricingClient initialPricingData={null} initialPricingError={null} />;
}
