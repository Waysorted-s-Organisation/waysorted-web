import { Schema, model, models, type Document, type Model } from "mongoose";
import type { IAttachment, IReportEntry } from "./featureRequest";

export interface IRequestComment extends Document {
  featureId: Schema.Types.ObjectId;
  parent?: Schema.Types.ObjectId | null;
  authorId: string;
  authorName?: string;
  text: string;
  attachments: IAttachment[];
  likes?: number;
  likedBy?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  reports: IReportEntry[];
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

const RequestCommentSchema = new Schema<IRequestComment>(
  {
    featureId: { type: Schema.Types.ObjectId, ref: "FeatureRequest", required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "RequestComment", default: null, index: true },
    authorId: { type: String, required: true },
    authorName: { type: String },
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

RequestCommentSchema.index({ featureId: 1, parent: 1, createdAt: -1 });
RequestCommentSchema.index({ "reports.reporterId": 1 });

export type RequestCommentModel = Model<IRequestComment>;

const RequestComment =
  (models.RequestComment as RequestCommentModel) ||
  model<IRequestComment>("RequestComment", RequestCommentSchema);

export default RequestComment;
