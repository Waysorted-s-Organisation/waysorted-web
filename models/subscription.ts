import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type SubscriptionStatus =
  | "payment_pending"
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
      enum: ["payment_pending", "active", "cancel_scheduled", "cancelled", "halted", "expired", "refunded"],
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
      status: { $in: ["payment_pending", "active", "cancel_scheduled", "halted"] },
    },
    name: "one_live_subscription_per_user",
  },
);

const Subscription =
  (models.Subscription as SubscriptionModel) ||
  model<ISubscription, SubscriptionModel>("Subscription", SubscriptionSchema);

export default Subscription;
