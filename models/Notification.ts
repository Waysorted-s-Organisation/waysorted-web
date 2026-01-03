import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
    recipientId: string; // Auth ID
    senderId?: string; // Auth ID
    type: 'vote' | 'comment' | 'status_change' | 'mention';
    requestId?: string; // Ref to FeatureRequest
    commentId?: string; // Ref to FeatureComment
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipientId: { type: String, required: true },
    senderId: { type: String },
    type: { type: String, enum: ["vote", "comment", "status_change", "mention"], required: true },
    requestId: { type: Schema.Types.ObjectId, ref: "FeatureRequest" },
    commentId: { type: Schema.Types.ObjectId, ref: "FeatureComment" },
    read: { type: Boolean, default: false }
}, { timestamps: true });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
