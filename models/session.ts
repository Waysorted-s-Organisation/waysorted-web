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
}

export type SessionModel = Model<ISession>;

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    accessToken: String,
    refreshToken: String,
    accessTokenExpiresAt: Number,
    idToken: String,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    createdAt: { type: Date, default: Date.now },
    source: String,
  },
  { versionKey: false }
);

const Session =
  (models.Session as SessionModel) ||
  model<ISession, SessionModel>("Session", SessionSchema);

export default Session;
