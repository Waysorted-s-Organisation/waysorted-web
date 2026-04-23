import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type CreditLedgerReason =
  | "starter_grant"
  | "purchase_grant"
  | "subscription_cycle_grant"
  | "bonus_grant"
  | "reservation_hold"
  | "reservation_commit"
  | "reservation_release"
  | "refund_debit"
  | "compensation_credit"
  | "manual_adjustment";

export interface ICreditLedger {
  user: Types.ObjectId;
  deltaCredits: number;
  balanceAfter?: number | null;
  reason: CreditLedgerReason;
  featureCode?: string | null;
  toolCode?: string | null;
  purchase?: Types.ObjectId | null;
  subscription?: Types.ObjectId | null;
  reservation?: Types.ObjectId | null;
  refund?: Types.ObjectId | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type CreditLedgerModel = Model<ICreditLedger>;

const CreditLedgerSchema = new Schema<ICreditLedger, CreditLedgerModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deltaCredits: { type: Number, required: true },
    balanceAfter: { type: Number, default: null },
    reason: {
      type: String,
      required: true,
      enum: [
        "purchase_grant",
        "starter_grant",
        "subscription_cycle_grant",
        "bonus_grant",
        "reservation_hold",
        "reservation_commit",
        "reservation_release",
        "refund_debit",
        "compensation_credit",
        "manual_adjustment",
      ],
    },
    featureCode: { type: String, default: null },
    toolCode: { type: String, default: null },
    purchase: { type: Schema.Types.ObjectId, ref: "Purchase", default: null, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription", default: null, index: true },
    reservation: { type: Schema.Types.ObjectId, ref: "UsageReservation", default: null, index: true },
    refund: { type: Schema.Types.ObjectId, ref: "Refund", default: null, index: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CreditLedger =
  (models.CreditLedger as CreditLedgerModel) ||
  model<ICreditLedger, CreditLedgerModel>("CreditLedger", CreditLedgerSchema);

export default CreditLedger;
