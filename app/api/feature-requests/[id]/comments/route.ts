import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import FeatureComment from "@/models/featureComment";
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

// GET /api/feature-requests/[id]/comments - Get comments for a feature request
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid request ID" },
                { status: 400 }
            );
        }

        // Verify the feature request exists
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

        // Get all comments for this request
        const comments = await FeatureComment.find({
            featureId: id,
            isDeleted: false,
        })
            .sort({ createdAt: 1 })
            .lean();

        // Organize into tree structure (root comments + replies)
        const rootComments = comments.filter((c) => !c.parent);
        const replies = comments.filter((c) => c.parent);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const commentsWithReplies = rootComments.map((comment: any) => ({
            ...comment,
            replies: replies.filter(
                (r) => r.parent?.toString() === comment._id.toString()
            ),
        }));

        return NextResponse.json({
            success: true,
            data: commentsWithReplies,
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

// POST /api/feature-requests/[id]/comments - Add a comment
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "You must be logged in to comment" },
                { status: 401 }
            );
        }

        await dbConnect();

        const { id } = await params;
        const body = await req.json();
        const { text, parentId } = body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid request ID" },
                { status: 400 }
            );
        }

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "Comment text is required" },
                { status: 400 }
            );
        }

        // Verify the feature request exists
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

        // If replying to a comment, verify parent exists
        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                return NextResponse.json(
                    { success: false, error: "Invalid parent comment ID" },
                    { status: 400 }
                );
            }

            const parentComment = await FeatureComment.findOne({
                _id: parentId,
                featureId: id,
                isDeleted: false,
            });

            if (!parentComment) {
                return NextResponse.json(
                    { success: false, error: "Parent comment not found" },
                    { status: 404 }
                );
            }
        }

        const userId = user.id;

        const comment = await FeatureComment.create({
            featureId: id,
            parent: parentId ? new mongoose.Types.ObjectId(parentId) : null,
            authorId: userId,
            authorName: user.name || user.email?.split("@")[0] || "Anonymous",
            authorEmail: user.email,
            text: text.trim(),
        });

        return NextResponse.json(
            { success: true, data: comment },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create comment" },
            { status: 500 }
        );
    }
}
