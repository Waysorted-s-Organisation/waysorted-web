import type { Metadata } from "next";
import BillingClient from "@/app/billing/billing-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Payment",
  description: "Waysorted payment and checkout page.",
};

export default async function PaymentPage({
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
