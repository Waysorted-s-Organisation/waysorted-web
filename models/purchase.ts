import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type PurchaseKind = "starter" | "topup" | "subscription";
export type PurchaseStatus =
  | "created"
  | "pending"
  | "captured"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface IPurchase {
  user: Types.ObjectId;
  productCode: string;
  kind: PurchaseKind;
  status: PurchaseStatus;
  amountPaise: number;
  currency: string;
  basePriceInr?: number | null;
  pricingCountry?: string | null;
  pricingTier?: string | null;
  pricingCurrency?: string | null;
  pricingRiskFlags?: string[];
  creditsGranted: number;
  bonusCredits: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySubscriptionId?: string | null;
  receipt: string;
  grantApplied: boolean;
  capturedAt?: Date | null;
  refundedAt?: Date | null;
  refundedAmountPaise: number;
  refundedCreditsApplied: number;
  checkoutSource?: string | null;
  idempotencyKey: string;
  notes?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type PurchaseModel = Model<IPurchase>;

const PurchaseSchema = new Schema<IPurchase, PurchaseModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productCode: { type: String, required: true, index: true },
    kind: { type: String, required: true, enum: ["starter", "topup", "subscription"] },
    status: {
      type: String,
      required: true,
      default: "created",
      enum: ["created", "pending", "captured", "failed", "cancelled", "refunded", "partially_refunded"],
    },
    amountPaise: { type: Number, required: true, min: 100 },
    currency: { type: String, required: true, default: "INR" },
    basePriceInr: { type: Number, default: null, min: 0 },
    pricingCountry: { type: String, default: null, index: true },
    pricingTier: { type: String, default: null, index: true },
    pricingCurrency: { type: String, default: null },
    pricingRiskFlags: [{ type: String }],
    creditsGranted: { type: Number, required: true, min: 0 },
    bonusCredits: { type: Number, required: true, default: 0, min: 0 },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySubscriptionId: { type: String, default: null, index: true },
    receipt: { type: String, required: true, unique: true, index: true },
    grantApplied: { type: Boolean, required: true, default: false },
    capturedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundedAmountPaise: { type: Number, required: true, default: 0, min: 0 },
    refundedCreditsApplied: { type: Number, required: true, default: 0, min: 0 },
    checkoutSource: { type: String, default: null },
    idempotencyKey: { type: String, required: true, trim: true },
    notes: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

PurchaseSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, name: "user_1_idempotencyKey_1" },
);
PurchaseSchema.index({ status: 1, grantApplied: 1, createdAt: -1 });
PurchaseSchema.index(
  { razorpayOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { razorpayOrderId: { $type: "string" } },
    name: "razorpayOrderId_unique",
  },
);
PurchaseSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: { razorpayPaymentId: { $type: "string" } },
    name: "razorpayPaymentId_unique",
  },
);

const Purchase =
  (models.Purchase as PurchaseModel) ||
  model<IPurchase, PurchaseModel>("Purchase", PurchaseSchema);

export default Purchase;
