import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBoard extends Document {
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    ownerId: string; // Auth ID
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BoardSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    ownerId: { type: String, required: true },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

const Board: Model<IBoard> = mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);
export default Board;
