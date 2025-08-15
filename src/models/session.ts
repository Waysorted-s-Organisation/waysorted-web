import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession {
  sessionId: string;
  createdAt: Date;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number; // timestamp (ms)
  idToken?: string;
  user?: any;
  completed?: boolean;
  completedAt?: Date;
}

type SessionDoc = ISession & Document;

const SessionSchema = new Schema<SessionDoc>({
  sessionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  accessToken: { type: String },
  refreshToken: { type: String }, // NEW
  accessTokenExpiresAt: { type: Number }, // NEW
  idToken: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  completed: { type: Boolean },
  completedAt: { type: Date },
});

const Session: Model<SessionDoc> =
  mongoose.models.Session ||
  mongoose.model<SessionDoc>("Session", SessionSchema);

export default Session;
