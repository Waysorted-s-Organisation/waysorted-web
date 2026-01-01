import mongoose, { Document, Schema } from "mongoose";

export interface ICommentAttachment {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}

export interface ICommentReport {
    reporterId: string;
    reason: string;
    createdAt: Date;
}

export interface IFeatureComment extends Document {
    _id: mongoose.Types.ObjectId;
    featureId: mongoose.Types.ObjectId;
    parent: mongoose.Types.ObjectId | null;
    authorId: string;
    authorName?: string;
    authorEmail?: string;
    text: string;
    attachments: ICommentAttachment[];
    likes: number;
    likedBy: string[];
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    reports: ICommentReport[];
    createdAt: Date;
    updatedAt: Date;
}

const AttachmentSchema = new Schema<ICommentAttachment>(
    {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
    },
    { _id: false }
);

const ReportSchema = new Schema<ICommentReport>(
    {
        reporterId: String,
        reason: String,
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const FeatureCommentSchema = new Schema<IFeatureComment>(
    {
        featureId: {
            type: Schema.Types.ObjectId,
            ref: "FeatureRequest",
            required: true,
            index: true,
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: "FeatureComment",
            default: null,
            index: true,
        },
        authorId: { type: String, required: true },
        authorName: String,
        authorEmail: String,
        text: { type: String, required: true },
        attachments: { type: [AttachmentSchema], default: [] },
        likes: { type: Number, default: 0 },
        likedBy: { type: [String], default: [] },
        isDeleted: { type: Boolean, default: false },
        deletedAt: Date,
        deletedBy: String,
        reports: { type: [ReportSchema], default: [] },
    },
    { timestamps: true }
);

// Compound index for efficient comment fetching
FeatureCommentSchema.index({ featureId: 1, parent: 1, createdAt: -1 });

const FeatureComment =
    mongoose.models.FeatureComment ||
    mongoose.model<IFeatureComment>("FeatureComment", FeatureCommentSchema);

export default FeatureComment;
