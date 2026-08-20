import { NextRequest, NextResponse } from "next/server";
import { normalizeCouponCode } from "@/lib/billing/coupon-code";

export const dynamic = "force-dynamic";

/**
 * Short, shareable entry point for a discount code.
 *
 *     https://www.waysorted.com/claim/BOOST20
 *     https://www.waysorted.com/claim/BOOST20?product=sub_month_2
 *     https://www.waysorted.com/claim/BOOST20?product=sub_month_2&autostart=1
 *
 * Exists so a code can be handed out anywhere — a plugin modal, an email, a
 * conversation — without anyone having to assemble query parameters correctly.
 * Getting that wrong silently drops the code and charges full price, which is
 * exactly what happens today when a link omits it.
 *
 * A redirect rather than a page: there is nothing to render, and one canonical
 * destination means the checkout logic has a single entry point rather than two
 * that can drift.
 *
 * It deliberately does NOT validate the code. Validation needs the signed-in
 * user, their balance and the chosen product, and /billing does it server-side
 * before the code can affect a charge. Rejecting here would leak which codes
 * exist to anyone who can type a URL.
 */
/** A malformed percent-escape throws rather than returning the raw string. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return "";
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  // Shared with the plugin's checkout bridge, so the two entry points cannot
  // disagree about what a code looks like.
  const normalized = normalizeCouponCode(safeDecode(code));

  const target = new URL("/billing", request.nextUrl.origin);

  // A malformed code is dropped rather than forwarded. It cannot be valid, and
  // reflecting arbitrary input into the next URL is not worth the risk.
  if (normalized) {
    target.searchParams.set("coupon", normalized);
  }

  // Carried through so a link can name a specific plan, or open checkout
  // directly. Copied by name rather than wholesale: only these are meaningful
  // downstream, and forwarding everything would let a crafted link set the
  // price parameters the checkout guard relies on.
  for (const key of ["product", "autostart", "qa", "qc", "qv"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }

  // 307, not 308: these links are promotional and their destination may change.
  // A permanently-cached redirect would outlive the campaign in browsers.
  return NextResponse.redirect(target, 307);
}
