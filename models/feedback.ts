import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IFeedback {
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  userId?: Types.ObjectId;
  userEmail?: string;
  userName?: string;
  path?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback, Model<IFeedback>>(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
    isAnonymous: { type: Boolean, default: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String, trim: true, lowercase: true },
    userName: { type: String, trim: true },
    path: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Feedback = (models.Feedback as Model<IFeedback>) || model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;