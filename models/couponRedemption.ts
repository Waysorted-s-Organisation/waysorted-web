import { Model, Schema, Types, model, models } from "mongoose";
import "./user";
import "./coupon";
import "./purchase";

export type CouponRedemptionStatus = "reserved" | "redeemed" | "released";

/**
 * One customer's claim on one coupon, reserved before the provider is called.
 *
 * The money safety lives in the two indexes below, not in application code.
 * A check-then-write in the route would race with itself: two concurrent
 * checkouts both read "not yet redeemed" and both proceed.
 */
export interface ICouponRedemption {
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  purchase: Types.ObjectId;
  code: string;
  subscriptionId?: string | null;
  discountPaise: number;
  currency: string;
  status: CouponRedemptionStatus;
  reservedAt: Date;
  redeemedAt?: Date | null;
  releasedAt?: Date | null;
  releaseReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CouponRedemptionModel = Model<ICouponRedemption>;

const CouponRedemptionSchema = new Schema<ICouponRedemption, CouponRedemptionModel>(
  {
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purchase: { type: Schema.Types.ObjectId, ref: "Purchase", required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    subscriptionId: { type: String, default: null, index: true },
    discountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      required: true,
      default: "reserved",
      enum: ["reserved", "redeemed", "released"],
      index: true,
    },
    reservedAt: { type: Date, required: true, default: () => new Date() },
    redeemedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    releaseReason: { type: String, default: null },
  },
  { timestamps: true },
);

/**
 * One purchase can never redeem twice.
 *
 * Also the retry guard: a declined card is routine, and the customer is told to
 * try again. On the retry this index is what the second attempt collides with,
 * and the collision is benign — the reservation already belongs to this
 * purchase, so it is reused rather than treated as the code being spent.
 */
CouponRedemptionSchema.index({ purchase: 1 }, { unique: true, name: "purchase_1" });

/**
 * One live claim per (coupon, user).
 *
 * Partial on the two statuses that consume the code, so a `released` row leaves
 * the customer free to try again. Without that, a single abandoned checkout
 * would permanently burn a maxPerUser:1 code for someone who paid nothing.
 */
CouponRedemptionSchema.index(
  { coupon: 1, user: 1 },
  {
    unique: true,
    name: "coupon_1_user_1_active",
    partialFilterExpression: { status: { $in: ["reserved", "redeemed"] } },
  },
);

const CouponRedemption =
  (models.CouponRedemption as CouponRedemptionModel) ||
  model<ICouponRedemption, CouponRedemptionModel>("CouponRedemption", CouponRedemptionSchema);

export default CouponRedemption;
