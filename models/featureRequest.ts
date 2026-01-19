import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface IReportEntry {
  reporterId: string;
  reason: string;
  createdAt: Date;
}

export interface IFeatureRequest extends Document {
  title: string;
  description?: string;
  type?: string;
  board?: string;
  attachments: IAttachment[];
  status: string;
  authorId: string;
  authorName?: string;
  votes: number;
  votedBy: string[];
  reports: IReportEntry[];
  isDeleted: boolean;
  isPublic?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  commentsCount?: number;
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

const ReportSchema = new Schema<IReportEntry>(
  {
    reporterId: String,
    reason: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FeatureRequestSchema = new Schema<IFeatureRequest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, default: "feature" },
    board: { type: String, default: "" },
    attachments: { type: [AttachmentSchema], default: [] },
    status: { type: String, default: "under_review" },
    authorId: { type: String, required: true },
    authorName: { type: String },
    votes: { type: Number, default: 0 },
    votedBy: { type: [String], default: [] },
    reports: { type: [ReportSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FeatureRequestSchema.index({ isDeleted: 1, createdAt: -1 });
FeatureRequestSchema.index({ "reports.reporterId": 1 });

export type FeatureRequestModel = Model<IFeatureRequest>;

const FeatureRequest =
  (models.FeatureRequest as FeatureRequestModel) ||
  model<IFeatureRequest>("FeatureRequest", FeatureRequestSchema);

export default FeatureRequest;
