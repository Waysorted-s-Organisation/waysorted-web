import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type RefundStatus = "created" | "processed" | "failed";

export interface IRefund {
  user: Types.ObjectId;
  purchase: Types.ObjectId;
  paymentId: string;
  providerRefundId?: string | null;
  amountPaise: number;
  status: RefundStatus;
  reason?: string | null;
  initiatedBy?: Types.ObjectId | null;
  creditAdjustmentApplied: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type RefundModel = Model<IRefund>;

const RefundSchema = new Schema<IRefund, RefundModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purchase: { type: Schema.Types.ObjectId, ref: "Purchase", required: true, index: true },
    paymentId: { type: String, required: true, index: true },
    providerRefundId: { type: String, default: null },
    amountPaise: { type: Number, required: true, min: 1 },
    status: { type: String, required: true, default: "created", enum: ["created", "processed", "failed"] },
    reason: { type: String, default: null },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    creditAdjustmentApplied: { type: Boolean, required: true, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

RefundSchema.index(
  { providerRefundId: 1 },
  { unique: true, sparse: true, name: "providerRefundId_1" },
);

const Refund =
  (models.Refund as RefundModel) ||
  model<IRefund, RefundModel>("Refund", RefundSchema);

export default Refund;
