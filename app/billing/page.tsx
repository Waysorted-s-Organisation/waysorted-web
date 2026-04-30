import type { Metadata } from "next";
import BillingClient from "./billing-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Billing",
  description: "Waysorted billing and subscription management.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ bridge?: string; product?: string; autostart?: string }>;
}) {
  const params = await searchParams;

  return (
    <BillingClient
      bridgeToken={params.bridge || null}
      autostart={params.autostart === "1"}
      initialProductCode={params.product || null}
    />
  );
}
