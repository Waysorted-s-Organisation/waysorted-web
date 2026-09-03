import type { Metadata } from "next";
import PricingClient from "./pricing-client";

// Title, description and canonical are set explicitly. Without them this route
// inherited the root layout's homepage title AND description verbatim, so /
// and /pricing were served to Google as duplicates of each other, and the
// inherited alternates.canonical pointed /pricing at the homepage.
// This is static metadata, so it does not make the route dynamic.
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
    // Declared here because this block REPLACES the root layout's openGraph
    // rather than merging into it - so naming a title and url quietly dropped
    // the site's share image, and /pricing was the one public page that shared
    // with no card at all. It still had twitter:image, because it declares no
    // twitter block and that one does inherit, which is why the gap only showed
    // on the og:image surfaces: LinkedIn, Facebook, WhatsApp, Slack.
    images: [
      {
        url: "/images/og-image.e13cfee0.png",
        width: 1200,
        height: 675,
        alt: "Waysorted - Accelerate every idea with one powerful suite",
      },
    ],
  },
};

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
