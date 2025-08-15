import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmail extends Document {
  email: string;
}

const EmailSchema = new Schema<IEmail>(
  {
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Email: Model<IEmail> =
  mongoose.models.Email || mongoose.model<IEmail>("Email", EmailSchema);

export default Email;
