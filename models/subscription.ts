import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type SubscriptionStatus =
  | "payment_pending"
  /**
   * Mandate authorised, first plan charge deliberately scheduled for a future date.
   *
   * Distinct from `payment_pending`, which means "checkout started, never completed" and is what the
   * 2h reconciler cancels. A future-dated subscription rests in the provider's `authenticated` state
   * for an entire cycle by design, so without its own status the reconciler would cancel it - and it
   * would also permanently occupy the reconciler's limited per-run window, starving the genuinely
   * abandoned checkouts that sweep exists to clean up.
   */
  | "scheduled"
  | "active"
  | "cancel_scheduled"
  | "cancelled"
  | "halted"
  | "expired"
  | "refunded";

export interface ISubscription {
  user: Types.ObjectId;
  planCode: string;
  status: SubscriptionStatus;
  providerPlanId?: string | null;
  providerSubscriptionId: string;
  pricingCountry?: string | null;
  pricingTier?: string | null;
  pricingCurrency?: string | null;
  amountSubunits?: number | null;
  basePriceInr?: number | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  nextChargeAt?: Date | null;
  cancelAtCycleEnd: boolean;
  lastCreditsGrantCycleKey?: string | null;
  lastCreditsGrantedAt?: Date | null;
  lastPaymentId?: string | null;
  canceledAt?: Date | null;
  /** Set when an unpayable pending subscription was retired to free the one-live-subscription slot. */
  supersededAt?: Date | null;
  /** True when the provider-side cancellation failed and must be retried by the reconciler. */
  providerCancellationPending?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type SubscriptionModel = Model<ISubscription>;

const SubscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planCode: { type: String, required: true, index: true },
    status: {
      type: String,
      required: true,
      default: "payment_pending",
      enum: ["payment_pending", "scheduled", "active", "cancel_scheduled", "cancelled", "halted", "expired", "refunded"],
    },
    providerPlanId: { type: String, default: null },
    providerSubscriptionId: { type: String, required: true, unique: true, index: true },
    pricingCountry: { type: String, default: null, index: true },
    pricingTier: { type: String, default: null, index: true },
    pricingCurrency: { type: String, default: null },
    amountSubunits: { type: Number, default: null, min: 0 },
    basePriceInr: { type: Number, default: null, min: 0 },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    nextChargeAt: { type: Date, default: null },
    cancelAtCycleEnd: { type: Boolean, default: false },
    lastCreditsGrantCycleKey: { type: String, default: null, index: true },
    lastCreditsGrantedAt: { type: Date, default: null },
    lastPaymentId: { type: String, default: null },
    canceledAt: { type: Date, default: null },
    supersededAt: { type: Date, default: null },
    providerCancellationPending: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      // `scheduled` is a live subscription: the mandate is authorised and a charge is booked, so it
      // must occupy the one-live-subscription slot exactly like the others.
      status: { $in: ["payment_pending", "scheduled", "active", "cancel_scheduled", "halted"] },
    },
    name: "one_live_subscription_per_user",
  },
);

const Subscription =
  (models.Subscription as SubscriptionModel) ||
  model<ISubscription, SubscriptionModel>("Subscription", SubscriptionSchema);

export default Subscription;
