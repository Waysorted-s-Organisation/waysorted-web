import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export type StarterGrantStatus = "granted" | "blocked" | "review_pending";

export interface IStarterGrant {
  user: Types.ObjectId;
  grantedCredits: number;
  status: StarterGrantStatus;
  riskScore: number;
  decisionReason?: string | null;
  emailHash: string;
  googleSubHash?: string | null;
  ipPrefixHash?: string | null;
  userAgentHash?: string | null;
  deviceFingerprintHash?: string | null;
  source?: string | null;
  grantedAt?: Date | null;
  blockedAt?: Date | null;
  reviewedAt?: Date | null;
  notes?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type StarterGrantModel = Model<IStarterGrant>;

const StarterGrantSchema = new Schema<IStarterGrant, StarterGrantModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    grantedCredits: { type: Number, required: true, default: 300, min: 0 },
    status: {
      type: String,
      required: true,
      default: "review_pending",
      enum: ["granted", "blocked", "review_pending"],
    },
    riskScore: { type: Number, required: true, default: 0, min: 0 },
    decisionReason: { type: String, default: null },
    emailHash: { type: String, required: true, index: true },
    googleSubHash: { type: String, default: null, index: true },
    ipPrefixHash: { type: String, default: null, index: true },
    userAgentHash: { type: String, default: null, index: true },
    deviceFingerprintHash: { type: String, default: null, index: true },
    source: { type: String, default: null },
    grantedAt: { type: Date, default: null },
    blockedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    notes: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const StarterGrant =
  (models.StarterGrant as StarterGrantModel) ||
  model<IStarterGrant, StarterGrantModel>("StarterGrant", StarterGrantSchema);

export default StarterGrant;
