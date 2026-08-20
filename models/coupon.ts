import { Model, Schema, model, models } from "mongoose";

/**
 * A discount code applied to the first cycle of a subscription.
 *
 * There is deliberately no Razorpay Offer id here. The mechanism creates the
 * subscription on the FULL-price plan with `start_at` one cycle out and an
 * addon equal to the discounted first cycle, so the discount is an amount we
 * compute rather than an object Razorpay owns. That keeps the plan cache key
 * (`${currency}:${amountPaise}:${tier}`) untouched and stops a plan
 * proliferating per discount — and unlike Offers, it works in every currency
 * and every payment method.
 */
export interface ICoupon {
  code: string;
  percent: number;
  appliesToProductCodes: string[];
  maxRedemptions: number | null;
  maxPerUser: number;
  validFrom?: Date | null;
  validUntil?: Date | null;
  active: boolean;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CouponModel = Model<ICoupon>;

const CouponSchema = new Schema<ICoupon, CouponModel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    // Bounded at 99: a 100% discount would produce a zero upfront, and the
    // mechanism needs a real authorisation charge to establish the mandate.
    percent: { type: Number, required: true, min: 1, max: 99 },
    // Empty means "no product", not "all products". A code that silently
    // applied everywhere because someone forgot a field is not a default worth
    // having when the field controls money.
    appliesToProductCodes: { type: [String], required: true, default: [] },
    // null means uncapped globally; per-user is always capped.
    maxRedemptions: { type: Number, default: null, min: 1 },
    /**
     * Fixed at 1, and enforced by a partial unique index on
     * (coupon, user) over status in [reserved, redeemed].
     *
     * An index can only express 1. Allowing this field to hold an arbitrary N
     * while the index enforces 1 would read as a working limit and behave as a
     * different one — so the schema refuses any other value rather than
     * pretending. Raising it means counting inside runBillingTransaction, and
     * that is a deliberate change, not a config edit.
     */
    maxPerUser: { type: Number, required: true, default: 1, min: 1, max: 1 },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    active: { type: Boolean, required: true, default: false },
    description: { type: String, default: null },
  },
  { timestamps: true },
);

const Coupon = (models.Coupon as CouponModel) || model<ICoupon, CouponModel>("Coupon", CouponSchema);

export default Coupon;
