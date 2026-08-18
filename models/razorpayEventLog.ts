import { Model, Schema, model, models } from "mongoose";

export interface IRazorpayEventLog {
  eventId: string;
  eventType: string;
  signature?: string | null;
  payload: Record<string, unknown>;
  status: "received" | "processing" | "processed" | "ignored" | "failed";
  processedAt?: Date | null;
  errorMessage?: string | null;
  resultReason?: string | null;
  processingAttemptId?: string | null;
  processingStartedAt?: Date | null;
  processingLeaseExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type RazorpayEventLogModel = Model<IRazorpayEventLog>;

const RazorpayEventLogSchema = new Schema<IRazorpayEventLog, RazorpayEventLogModel>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    signature: { type: String, default: null },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      required: true,
      default: "received",
      enum: ["received", "processing", "processed", "ignored", "failed"],
    },
    processedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    resultReason: { type: String, default: null },
    processingAttemptId: { type: String, default: null },
    processingStartedAt: { type: Date, default: null },
    processingLeaseExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

RazorpayEventLogSchema.index({ status: 1, processingLeaseExpiresAt: 1 });
RazorpayEventLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 },
);

const RazorpayEventLog =
  (models.RazorpayEventLog as RazorpayEventLogModel) ||
  model<IRazorpayEventLog, RazorpayEventLogModel>("RazorpayEventLog", RazorpayEventLogSchema);

export default RazorpayEventLog;
