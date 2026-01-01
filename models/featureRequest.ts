import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}

export interface IReport {
    reporterId: string;
    reason: string;
    createdAt: Date;
}

export interface IFeatureRequest extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    type: "feature" | "bug";
    board: string;
    attachments: IAttachment[];
    status: "under_review" | "planned" | "in_progress" | "released" | "not_done";
    authorId: string;
    authorName?: string;
    authorEmail?: string;
    votes: number;
    votedBy: string[];
    reports: IReport[];
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
    {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
    },
    { _id: false }
);

const ReportSchema = new Schema<IReport>(
    {
        reporterId: String,
        reason: String,
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const FeatureRequestSchema = new Schema<IFeatureRequest>(
    {
        title: { type: String, required: true },
        description: String,
        type: { type: String, enum: ["feature", "bug"], default: "feature" },
        board: { type: String, default: "general" },
        attachments: { type: [AttachmentSchema], default: [] },
        status: {
            type: String,
            enum: ["under_review", "planned", "in_progress", "released", "not_done"],
            default: "under_review",
        },
        authorId: { type: String, required: true, index: true },
        authorName: String,
        authorEmail: String,
        votes: { type: Number, default: 0 },
        votedBy: { type: [String], default: [] },
        reports: { type: [ReportSchema], default: [] },
        isDeleted: { type: Boolean, default: false },
        deletedAt: Date,
        deletedBy: String,
    },
    { timestamps: true }
);

// Indexes for efficient querying
FeatureRequestSchema.index({ isDeleted: 1, createdAt: -1 });
FeatureRequestSchema.index({ status: 1 });
FeatureRequestSchema.index({ votes: -1 });

const FeatureRequest =
    mongoose.models.FeatureRequest ||
    mongoose.model<IFeatureRequest>("FeatureRequest", FeatureRequestSchema);

export default FeatureRequest;
