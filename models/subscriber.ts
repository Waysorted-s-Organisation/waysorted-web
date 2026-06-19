import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriber extends Document {
  name?: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribed_at: Date;
  updated_at: Date;
  source: string;
  preferences?: Record<string, "subscribed" | "unsubscribed">;
  unsubscribed_at?: Date | null;
  resubscribed_at?: Date;
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
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active',
  },
  subscribed_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    default: 'website',
  },
  preferences: {
    type: Object,
    default: {},
  },
  unsubscribed_at: {
    type: Date,
    default: null,
  },
  resubscribed_at: {
    type: Date,
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
