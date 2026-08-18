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
  searchParams: Promise<{
    product?: string;
    autostart?: string;
    qa?: string;
    qc?: string;
    qv?: string;
  }>;
}) {
  const params = await searchParams;
  // The price the customer was shown on /pricing, carried across the hand-off so checkout can
  // refuse to auto-open the payment modal at a different amount.
  const quotedAmountSubunits = Number(params.qa);

  return (
    <BillingClient
      autostart={params.autostart === "1"}
      initialProductCode={params.product || null}
      quotedAmountSubunits={Number.isSafeInteger(quotedAmountSubunits) ? quotedAmountSubunits : null}
      quotedCurrency={params.qc || null}
      quotedPricingVersion={params.qv || null}
    />
  );
}
