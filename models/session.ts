import { Schema, model, models, Types, Model } from "mongoose";

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
  },
  { versionKey: false }
);

SessionSchema.index({ sessionId: 1 }, { unique: true });

const Session =
  (models.Session as SessionModel) || model<ISession, SessionModel>("Session", SessionSchema);

export default Session;
