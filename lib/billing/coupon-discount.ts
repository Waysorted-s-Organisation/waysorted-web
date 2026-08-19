import { minimumChargeSubunits } from "@/lib/billing/money";
import type { ICoupon } from "@/models/coupon";

/**
 * The floor Purchase.amountPaise enforces (models/purchase.ts: `min: 100`).
 *
 * A discount that produces an upfront below this writes a Purchase that fails
 * validation AFTER the provider has already been called — leaving a live
 * subscription with no local record of it.
 */
export const PURCHASE_MINIMUM_SUBUNITS = 100;

export type CouponRejection =
  | "coupon_inactive"
  | "coupon_not_started"
  | "coupon_expired"
  | "coupon_not_applicable"
  | "coupon_amount_too_small";

export interface DiscountQuote {
  originalAmountPaise: number;
  discountPaise: number;
  upfrontAmountPaise: number;
  percent: number;
  code: string;
}

export type DiscountResult =
  | { ok: true; quote: DiscountQuote }
  | { ok: false; reason: CouponRejection };

/**
 * Whether a coupon may be applied to this product at this moment.
 *
 * Separate from the arithmetic so the route can reject early, before it has
 * resolved a price, and so both halves are testable without a database.
 */
export function checkCouponEligibility(
  coupon: Pick<ICoupon, "active" | "validFrom" | "validUntil" | "appliesToProductCodes">,
  productCode: string,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: CouponRejection } {
  if (!coupon.active) return { ok: false, reason: "coupon_inactive" };
  if (coupon.validFrom && now < coupon.validFrom) return { ok: false, reason: "coupon_not_started" };
  if (coupon.validUntil && now > coupon.validUntil) return { ok: false, reason: "coupon_expired" };
  // An empty list means no product, not every product. A code that applied
  // everywhere because a field was left unset is not a safe default when the
  // field controls money.
  if (!coupon.appliesToProductCodes.includes(productCode)) {
    return { ok: false, reason: "coupon_not_applicable" };
  }
  return { ok: true };
}

/**
 * The discounted first cycle.
 *
 * Rounds, never floors. Flooring the discount would undercharge by up to one
 * subunit on every redemption, and the difference is silently absorbed rather
 * than reconciled anywhere.
 *
 * The upfront must clear two separate floors: the provider's minimum
 * chargeable amount for the currency, and the `min: 100` that
 * models/purchase.ts enforces. They are not the same number in every currency,
 * so both are checked rather than assuming one implies the other.
 */
export function quoteCouponDiscount(options: {
  originalAmountPaise: number;
  percent: number;
  currency: string;
  code: string;
}): DiscountResult {
  const { originalAmountPaise, percent, currency, code } = options;

  if (!Number.isInteger(originalAmountPaise) || originalAmountPaise <= 0) {
    return { ok: false, reason: "coupon_amount_too_small" };
  }
  if (!Number.isFinite(percent) || percent < 1 || percent > 99) {
    // 100% is rejected by construction: the mechanism needs a real
    // authorisation charge to establish the mandate, so a zero upfront has no
    // valid representation.
    return { ok: false, reason: "coupon_not_applicable" };
  }

  const discountPaise = Math.round((originalAmountPaise * percent) / 100);
  const upfrontAmountPaise = originalAmountPaise - discountPaise;
  const floor = Math.max(minimumChargeSubunits(currency), PURCHASE_MINIMUM_SUBUNITS);

  if (upfrontAmountPaise < floor) {
    return { ok: false, reason: "coupon_amount_too_small" };
  }

  return {
    ok: true,
    quote: {
      originalAmountPaise,
      discountPaise,
      upfrontAmountPaise,
      percent,
      code: code.trim().toUpperCase(),
    },
  };
}

/**
 * The idempotency key must change when the coupon does.
 *
 * `subscriptions/create` reuses a Purchase by idempotency key and skips
 * `createPurchaseRecord` entirely on that path. So without the code folded in,
 * applying a coupon on a retry would reuse a full-price Purchase row while
 * Razorpay charged the discounted upfront — and `verify` compares the payment
 * against that row.
 */
export function couponScopedIdempotencyKey(baseKey: string, code?: string | null): string {
  const normalized = (code || "").trim().toUpperCase();
  return normalized ? `${baseKey}:coupon:${normalized}` : baseKey;
}
