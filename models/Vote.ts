import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVote extends Document {
    userId: string; // Auth ID
    requestId: string; // Ref to FeatureRequest
    type: 'upvote' | 'downvote';
    createdAt: Date;
    updatedAt: Date;
}

const VoteSchema: Schema = new Schema({
    userId: { type: String, required: true },
    requestId: { type: Schema.Types.ObjectId, ref: "FeatureRequest", required: true },
    type: { type: String, enum: ["upvote", "downvote"], default: "upvote" }
}, { timestamps: true });

const Vote: Model<IVote> = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);
export default Vote;
