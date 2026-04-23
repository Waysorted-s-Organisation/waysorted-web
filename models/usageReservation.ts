import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type UsageReservationStatus =
  | "reserved"
  | "committed"
  | "released"
  | "expired"
  | "compensated";

export interface IUsageReservation {
  user: Types.ObjectId;
  featureCode: string;
  toolCode?: string | null;
  sizeBucket?: string | null;
  creditsReserved: number;
  status: UsageReservationStatus;
  idempotencyKey: string;
  processor?: string | null;
  processorJobId?: string | null;
  processorToken?: string | null;
  selectedOptions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  expiresAt: Date;
  committedAt?: Date | null;
  releasedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type UsageReservationModel = Model<IUsageReservation>;

const UsageReservationSchema = new Schema<IUsageReservation, UsageReservationModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    featureCode: { type: String, required: true, index: true },
    toolCode: { type: String, default: null },
    sizeBucket: { type: String, default: null },
    creditsReserved: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      default: "reserved",
      enum: ["reserved", "committed", "released", "expired", "compensated"],
    },
    idempotencyKey: { type: String, required: true, unique: true, index: true, trim: true },
    processor: { type: String, default: null },
    processorJobId: { type: String, default: null },
    processorToken: { type: String, default: null },
    selectedOptions: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true, index: true },
    committedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UsageReservation =
  (models.UsageReservation as UsageReservationModel) ||
  model<IUsageReservation, UsageReservationModel>("UsageReservation", UsageReservationSchema);

export default UsageReservation;
