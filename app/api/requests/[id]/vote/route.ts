import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
    try {
        const params = await context?.params;
        const id = params?.id;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const request = await FeatureRequest.findById(id);
        if (!request) {
            return NextResponse.json({ message: "Request not found" }, { status: 404 });
        }

        const userIdStr = user.id.toString();
        const hasUpvoted = request.votedBy.includes(userIdStr);

        if (hasUpvoted) {
            // Remove vote
            request.votedBy = request.votedBy.filter((uid: string) => uid !== userIdStr);
            request.votes = Math.max(0, request.votes - 1);
        } else {
            // Add vote
            request.votedBy.push(userIdStr);
            request.votes += 1;
        }

        await request.save();

        return NextResponse.json({
            votes: request.votes,
            votedBy: request.votedBy,
            hasUpvoted: !hasUpvoted,
        });
    } catch (error) {
        console.error("Vote error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
