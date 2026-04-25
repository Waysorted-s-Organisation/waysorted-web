import { Schema, model, models, type Model, type Types } from "mongoose";
import type { BillingCycle, PaymentStatus, PlanId } from "@/types/payment";
import "./user";

export interface IPayment {
  userId: Types.ObjectId;
  planId: PlanId;
  billing: BillingCycle;
  amountPaise: number;
  currency: string;
  creditsToAdd: number;
  status: PaymentStatus;
  provider: "razorpay";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  failureCode?: string;
  failureReason?: string;
  source: "pricing_page";
  createdAt?: Date;
  updatedAt?: Date;
}

type PaymentModel = Model<IPayment>;

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: {
      type: String,
      enum: ["starter", "pro", "scale"],
      required: true,
      index: true,
    },
    billing: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    amountPaise: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    creditsToAdd: { type: Number, required: true },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
      index: true,
    },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    razorpayOrderId: { type: String, index: true, unique: true, sparse: true },
    razorpayPaymentId: { type: String, index: true, unique: true, sparse: true },
    razorpaySignature: { type: String },
    failureCode: { type: String },
    failureReason: { type: String },
    source: { type: String, enum: ["pricing_page"], default: "pricing_page" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Payment =
  (models.Payment as PaymentModel) || model<IPayment, PaymentModel>("Payment", PaymentSchema);

export default Payment;
