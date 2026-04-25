import type { Metadata } from "next";
import BillingClient from "@/app/billing/billing-client";

export const metadata: Metadata = {
  title: "Payment Test",
  description: "Internal Razorpay payment test page for Waysorted.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
    },
  },
};

export default async function PaymentPage({
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
