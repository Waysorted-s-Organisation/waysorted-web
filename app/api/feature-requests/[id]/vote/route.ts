import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vote from "@/models/Vote";
import FeatureRequest from "@/models/featureRequest";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id: requestId } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingVote = await Vote.findOne({ userId, requestId });

    if (existingVote) {
        await Vote.findByIdAndDelete(existingVote._id);
        await FeatureRequest.findByIdAndUpdate(requestId, {
            $pull: { votes: existingVote._id }
        });
        return NextResponse.json({ action: "removed" });
    } else {
        const newVote = await Vote.create({
            userId,
            requestId,
            type: "upvote"
        });
        await FeatureRequest.findByIdAndUpdate(requestId, {
            $push: { votes: newVote._id }
        });
        return NextResponse.json(newVote, { status: 201 });
    }
}
