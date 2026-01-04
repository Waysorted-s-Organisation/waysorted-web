import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RequestComment from "@/models/requestComment";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const id = context?.params?.id;

        await dbConnect();
        const comment = await RequestComment.findById(id);
        if (!comment) {
            return NextResponse.json({ message: "Comment not found" }, { status: 404 });
        }

        if (comment.authorId !== user.id) {
            return NextResponse.json({ message: "Not allowed" }, { status: 403 });
        }

        comment.isDeleted = true;
        comment.deletedAt = new Date();
        comment.deletedBy = user.id;
        await comment.save();

        // Decrement comments count
        const featureRequest = await FeatureRequest.findById(comment.featureId);
        if (featureRequest) {
            featureRequest.commentsCount = Math.max(0, (featureRequest.commentsCount || 0) - 1);
            await featureRequest.save();
        }

        return NextResponse.json({ ok: true, id: comment._id });
    } catch (err) {
        console.error("DELETE /api/comments/:id error", err);
        return NextResponse.json({ message: "Failed to delete comment" }, { status: 500 });
    }
}
