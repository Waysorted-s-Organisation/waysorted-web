import mongoose, { Schema, Document, Model } from "mongoose";

/* ---------- 1 ▸ declare the shape of a session ------------------------ */
export interface ISession {
  sessionId: string;
  createdAt: Date;
  accessToken?: string;
  idToken?: string;
  user?: any; // refine to a real user type if you like
  completed?: boolean;
  completedAt?: Date;
}

type SessionDoc = ISession & Document;

/* ---------- 2 ▸ build a typed schema ---------------------------------- */
const SessionSchema = new Schema<SessionDoc>({
  sessionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  accessToken: { type: String },
  idToken: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User" }, // ← ref, not Mixed
  completed: { type: Boolean },
  completedAt: { type: Date },
});

/* ---------- 3 ▸ export a typed model ---------------------------------- */
const Session: Model<SessionDoc> =
  mongoose.models.Session ||
  mongoose.model<SessionDoc>("Session", SessionSchema);

export default Session;
