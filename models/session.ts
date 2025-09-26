import { Schema, model, models, Types } from "mongoose";

interface ISession {
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

const Session = models.Session || model<ISession>("Session", SessionSchema);
export default Session;