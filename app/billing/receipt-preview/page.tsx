import { notFound } from "next/navigation";
import OrderComplete from "@/components/OrderComplete";

/**
 * Renders the order-complete screen without taking a payment.
 *
 * The real screen only appears after money has moved, which makes it the hardest
 * surface in the product to look at while building it. This exists so it can be
 * checked, and is refused outside development so it can never be mistaken for a
 * genuine receipt.
 */
export const dynamic = "force-dynamic";

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
        itemName="Waysorted Pro"
        amount="$6.00"
        total="$4.80"
        discountLabel="BOOST20 (20% off)"
        discountAmount="-$1.20"
        footnote="First month at the discounted rate, then $6.00 per month."
      />
    );
  }

  return <OrderComplete orderNumber="17362673" itemName="Waysorted Pro" amount="$6.00" />;
}
