import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderComplete from "@/components/OrderComplete";

/**
 * Renders the order-complete screen without taking a payment.
 *
 * The real screen only appears after money has moved, which makes it the hardest
 * surface in the product to look at while building it. This exists so it can be
 * checked, and must never be mistaken for a genuine receipt.
 *
 * Development only. To show it on production, use the temporary keyed link at
 * ./[key], which carries its own expiry - see that file.
 *
 * The numbers below are invented and fixed. Nothing here reads a real order.
 */
export const dynamic = "force-dynamic";

/**
 * Never indexable. /billing is not in the robots disallow list, so without this
 * a crawler could pick the page up and publish what looks like a real Waysorted
 * receipt, complete with an order number.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReceiptPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ discount?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { discount } = await searchParams;

  if (discount) {
    return (
      <OrderComplete
        orderNumber="17362673"
        itemName="Waysorted Core"
        amount="₹349.00"
        total="₹279.20"
        discountLabel="BOOST20 (20% off)"
        discountAmount="-₹69.80"
        footnote="First month at the discounted rate, then ₹349.00 per month."
      />
    );
  }

  return <OrderComplete orderNumber="17362673" itemName="Waysorted Core" amount="₹349.00" />;
}
