import { Schema, model, models, Document } from "mongoose";

export interface IComment extends Document {
    requestId: string;
    authorId: string;
    authorName: string;
    authorInitials: string;
    text: string;
    parentId?: string; // For nested replies
    createdAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        requestId: { type: String, required: true, index: true },
        authorId: { type: String, required: true },
        authorName: { type: String, required: true },
        authorInitials: { type: String, required: true },
        text: { type: String, required: true },
        parentId: { type: String, default: null },
    },
    { timestamps: true }
);

const Comment = models.Comment || model<IComment>("Comment", commentSchema);

export default Comment;
