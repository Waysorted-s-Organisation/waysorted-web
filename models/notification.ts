import { Schema, model, models, type Document, type Model } from "mongoose";

export interface INotification extends Document {
    recipientId: string;
    type: "vote" | "comment" | "status_change" | "mention" | "report";
    message: string;
    read: boolean;
    featureId?: string;
    commentId?: string;
    senderId?: string;
    senderName?: string;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipientId: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: ["vote", "comment", "status_change", "mention", "report"],
            required: true,
        },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        featureId: { type: Schema.Types.ObjectId, ref: "FeatureRequest" },
        commentId: { type: Schema.Types.ObjectId, ref: "Comment" },
        senderId: String,
        senderName: String,
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export type NotificationModel = Model<INotification>;

const Notification =
    (models.Notification as NotificationModel) ||
    model<INotification>("Notification", NotificationSchema);

export default Notification;
