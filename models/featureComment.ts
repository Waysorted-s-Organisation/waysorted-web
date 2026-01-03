import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFeatureComment extends Document {
    requestId: string; // Ref to FeatureRequest
    userId: string; // Auth ID
    authorName?: string;
    authorImage?: string;
    parentId?: string; // Ref to FeatureComment (threaded)
    text: string;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const FeatureCommentSchema: Schema = new Schema({
    requestId: { type: Schema.Types.ObjectId, ref: "FeatureRequest", required: true },
    userId: { type: String, required: true },
    authorName: { type: String },
    authorImage: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "FeatureComment", default: null },
    text: { type: String, required: true },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

const FeatureComment: Model<IFeatureComment> = mongoose.models.FeatureComment || mongoose.model<IFeatureComment>('FeatureComment', FeatureCommentSchema);
export default FeatureComment;
