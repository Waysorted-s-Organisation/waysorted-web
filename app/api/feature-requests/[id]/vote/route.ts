import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import Session from "@/models/session";
import type { IUser } from "@/models/user";
import { cookies } from "next/headers";
import mongoose from "mongoose";

// Helper to get current user from session (same pattern as /api/me)
async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) return null;

    try {
        await dbConnect();
        const session = await Session.findOne({ sessionId }).populate<{ user: IUser }>("user");

        if (!session || !session.user) return null;

        const user = session.user;
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            picture: user.picture,
        };
    } catch {
        return null;
    }
}

// POST /api/feature-requests/[id]/vote - Toggle vote on a feature request
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "You must be logged in to vote" },
                { status: 401 }
            );
        }

        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid request ID" },
                { status: 400 }
            );
        }

        const featureRequest = await FeatureRequest.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!featureRequest) {
            return NextResponse.json(
                { success: false, error: "Feature request not found" },
                { status: 404 }
            );
        }

        const userId = user.id;
        const hasVoted = featureRequest.votedBy.includes(userId);

        if (hasVoted) {
            // Remove vote
            featureRequest.votedBy = featureRequest.votedBy.filter(
                (voterId: string) => voterId !== userId
            );
            featureRequest.votes = Math.max(0, featureRequest.votes - 1);
        } else {
            // Add vote
            featureRequest.votedBy.push(userId);
            featureRequest.votes += 1;
        }

        await featureRequest.save();

        return NextResponse.json({
            success: true,
            data: {
                votes: featureRequest.votes,
                hasVoted: !hasVoted,
            },
        });
    } catch (error) {
        console.error("Error voting on feature request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to vote" },
            { status: 500 }
        );
    }
}
