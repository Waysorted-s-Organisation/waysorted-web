import { Schema, model, models, Types, Model } from "mongoose";
import "./user";

export interface ISession {
  sessionId: string;
  user?: Types.ObjectId;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  idToken?: string;
  completed?: boolean;
  completedAt?: Date;
  createdAt?: Date;
  source?: string; // Track where the auth request came from (e.g., "figma", "plugin", "web")
  ipAddress?: string | null;
  ipPrefix?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  countryCode?: string | null;
  pricingTierAtAuth?: string | null;
}

export type SessionModel = Model<ISession>;

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: { type: String, index: true }, // Add index for faster token lookups
    refreshToken: String,
    accessTokenExpiresAt: Number,
    idToken: String,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    createdAt: { type: Date, default: Date.now },
    source: String,
    ipAddress: { type: String, default: null },
    ipPrefix: { type: String, default: null },
    userAgent: { type: String, default: null },
    deviceId: { type: String, default: null },
    countryCode: { type: String, default: null, index: true },
    pricingTierAtAuth: { type: String, default: null },
  },
  { versionKey: false }
);

const Session =
  (models.Session as SessionModel) ||
  model<ISession, SessionModel>("Session", SessionSchema);

export default Session;
