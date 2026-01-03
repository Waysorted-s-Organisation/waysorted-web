import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFeatureRequest extends Document {
    title: string;
    description?: string;
    type: 'feature' | 'bug';
    status: 'planned' | 'in-progress' | 'not done' | 'released';
    userId: string; // Auth ID
    authorName?: string;
    authorImage?: string;
    boardId: string; // Ref to Board
    attachments: string[];
    votes: string[]; // Ref to Vote
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const FeatureRequestSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["feature", "bug"], required: true },
    status: { type: String, enum: ["planned", "in-progress", "not done", "released"], default: "planned" },
    userId: { type: String, required: true },
    authorName: { type: String },
    authorImage: { type: String },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    attachments: [{ type: String }],
    votes: [{ type: Schema.Types.ObjectId, ref: "Vote" }],
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Prevent overwrite err
const FeatureRequest: Model<IFeatureRequest> = mongoose.models.FeatureRequest || mongoose.model<IFeatureRequest>('FeatureRequest', FeatureRequestSchema);
export default FeatureRequest;
