import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureComment from "@/models/featureComment";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const { id: requestId } = await params;

    const comments = await FeatureComment.find({ requestId, deletedAt: null })
        .sort({ createdAt: 1 }); // Oldest first (threaded logic might run on frontend)

    return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const { id: requestId } = await params;
        const body = await req.json();

        // body: { userId, authorName, text, parentId ... }
        const { userId, text } = body;
        if (!userId || !text) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const comment = await FeatureComment.create({
            ...body,
            requestId,
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error adding comment:", error);
        return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }
}
