import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderComplete from "@/components/OrderComplete";

/**
 * A temporary, unguessable link to the order-complete screen, for recording it.
 *
 * The plain /billing/receipt-preview stays development-only. This variant exists
 * so the screen can be filmed on production without an environment variable to
 * set and, more importantly, to remember to unset.
 *
 * TWO gates, and both have to pass:
 *
 *   1. The key below, which is the URL. It is 96 bits of randomness, so the page
 *      is not reachable by guessing or by crawling - nothing links to it.
 *   2. EXPIRES_AT. After that instant this 404s on its own.
 *
 * The expiry is the point. This renders what looks exactly like a real Waysorted
 * receipt, order number and all, and the failure mode for a "temporary" page is
 * that it is still public a year later because the person who would have removed
 * it moved on. Expiring by default means forgetting is safe: the worst case is a
 * dead link, not a fake receipt sitting on the marketing domain indefinitely.
 *
 * Once it has lapsed, delete this directory. Bumping the date to revive it is
 * fine, but it should be a deliberate act each time.
 */
const PREVIEW_KEY = "ns2BBTr_LyOvMpDL";

/** 2026-08-24T00:00:00Z - about two days, to survive a scheduling slip. */
const EXPIRES_AT = Date.UTC(2026, 7, 24, 0, 0, 0);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReceiptPreviewLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ discount?: string }>;
}) {
  const { key } = await params;
  if (key !== PREVIEW_KEY) notFound();
  if (Date.now() >= EXPIRES_AT) notFound();

  const { discount } = await searchParams;

  // Invented, fixed figures. Nothing here reads a real order.
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
