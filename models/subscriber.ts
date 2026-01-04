import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriber extends Document {
  name?: string;
  email: string;
  createdAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
