import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type BillingSubscriptionStatus =
  | "inactive"
  | "payment_pending"
  | "active"
  | "cancel_scheduled"
  | "cancelled"
  | "halted"
  | "expired"
  | "refund_pending"
  | "refunded";

export interface IUserBilling {
  user: Types.ObjectId;
  availableCredits: number;
  heldCredits: number;
  lifetimePurchasedCredits: number;
  lifetimeBonusCredits: number;
  lifetimeSpentCredits: number;
  lifetimeRefundedCredits: number;
  pricingVersion: string;
  firstSuccessfulPurchaseAt?: Date | null;
  subscriptionStatus: BillingSubscriptionStatus;
  subscriptionPlanCode?: string | null;
  subscriptionStartAt?: Date | null;
  subscriptionEndAt?: Date | null;
  subscriptionRenewsAt?: Date | null;
  subscriptionWillCancelAt?: Date | null;
  cancelAtCycleEnd: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserBillingModel = Model<IUserBilling>;

const UserBillingSchema = new Schema<IUserBilling, UserBillingModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    availableCredits: { type: Number, required: true, default: 0 },
    heldCredits: { type: Number, required: true, default: 0 },
    lifetimePurchasedCredits: { type: Number, required: true, default: 0 },
    lifetimeBonusCredits: { type: Number, required: true, default: 0 },
    lifetimeSpentCredits: { type: Number, required: true, default: 0 },
    lifetimeRefundedCredits: { type: Number, required: true, default: 0 },
    pricingVersion: { type: String, required: true, default: "v1" },
    firstSuccessfulPurchaseAt: { type: Date, default: null },
    subscriptionStatus: {
      type: String,
      required: true,
      default: "inactive",
      enum: [
        "inactive",
        "payment_pending",
        "active",
        "cancel_scheduled",
        "cancelled",
        "halted",
        "expired",
        "refund_pending",
        "refunded",
      ],
    },
    subscriptionPlanCode: { type: String, default: null },
    subscriptionStartAt: { type: Date, default: null },
    subscriptionEndAt: { type: Date, default: null },
    subscriptionRenewsAt: { type: Date, default: null },
    subscriptionWillCancelAt: { type: Date, default: null },
    cancelAtCycleEnd: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserBilling =
  (models.UserBilling as UserBillingModel) ||
  model<IUserBilling, UserBillingModel>("UserBilling", UserBillingSchema);

export default UserBilling;
