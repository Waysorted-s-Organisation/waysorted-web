import type { Metadata } from "next";
import BillingClient from "./billing-client";

export const metadata: Metadata = {
  title: "Billing",
  description: "Waysorted billing and subscription management.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ bridge?: string; product?: string }>;
}) {
  const params = await searchParams;

  return (
    <BillingClient
      bridgeToken={params.bridge || null}
      initialProductCode={params.product || null}
    />
  );
}
