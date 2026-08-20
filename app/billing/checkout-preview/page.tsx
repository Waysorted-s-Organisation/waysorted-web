import { notFound } from "next/navigation";
import { Suspense } from "react";
import CheckoutPreview from "./preview-client";

/**
 * Development-only view of the checkout card.
 *
 * The real page needs a signed-in account with a priced catalogue, which makes
 * the layout awkward to look at while building it. Refused outside development.
 */
export const dynamic = "force-dynamic";

export default async function CheckoutPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { coupon } = await searchParams;

  return (
    <Suspense fallback={null}>
      <CheckoutPreview coupon={coupon || null} />
    </Suspense>
  );
}
