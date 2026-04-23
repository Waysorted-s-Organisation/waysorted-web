import { Model, Schema, model, models } from "mongoose";

export type BillingProductKind = "starter" | "topup" | "subscription";
export type BillingEligibility = "new_user" | "subscriber" | "standard" | "everyone";

export interface IBillingProduct {
  code: string;
  name: string;
  kind: BillingProductKind;
  eligibility: BillingEligibility;
  priceInr: number;
  amountPaise: number;
  creditsGranted: number;
  bonusCredits: number;
  billingCycle: "one_time" | "yearly";
  currency: "INR";
  active: boolean;
  version: string;
  providerPlanId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type BillingProductModel = Model<IBillingProduct>;

const BillingProductSchema = new Schema<IBillingProduct, BillingProductModel>(
  {
    code: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    kind: { type: String, required: true, enum: ["starter", "topup", "subscription"] },
    eligibility: {
      type: String,
      required: true,
      enum: ["new_user", "subscriber", "standard", "everyone"],
    },
    priceInr: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true, min: 100 },
    creditsGranted: { type: Number, required: true, min: 0 },
    bonusCredits: { type: Number, default: 0, min: 0 },
    billingCycle: { type: String, required: true, enum: ["one_time", "yearly"] },
    currency: { type: String, required: true, default: "INR", enum: ["INR"] },
    active: { type: Boolean, default: true },
    version: { type: String, required: true, default: "v1" },
    providerPlanId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const BillingProduct =
  (models.BillingProduct as BillingProductModel) ||
  model<IBillingProduct, BillingProductModel>("BillingProduct", BillingProductSchema);

export default BillingProduct;
