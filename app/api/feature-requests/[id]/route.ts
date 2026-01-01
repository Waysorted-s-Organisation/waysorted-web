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

// GET /api/feature-requests/[id] - Get single feature request with comments
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

        const featureRequest = await FeatureRequest.findOne({
            _id: id,
            isDeleted: false,
        }).lean();

        if (!featureRequest) {
            return NextResponse.json(
                { success: false, error: "Feature request not found" },
                { status: 404 }
            );
        }

        // Get comments for this request
        const comments = await FeatureComment.find({
            featureId: id,
            isDeleted: false,
        })
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: { ...featureRequest, comments },
        });
    } catch (error) {
        console.error("Error fetching feature request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch feature request" },
            { status: 500 }
        );
    }
}

// DELETE /api/feature-requests/[id] - Soft delete a feature request
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
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

        const featureRequest = await FeatureRequest.findById(id);

        if (!featureRequest) {
            return NextResponse.json(
                { success: false, error: "Feature request not found" },
                { status: 404 }
            );
        }

        // Only author can delete their own request
        const userId = user.id;
        if (featureRequest.authorId !== userId) {
            return NextResponse.json(
                { success: false, error: "You can only delete your own requests" },
                { status: 403 }
            );
        }

        featureRequest.isDeleted = true;
        featureRequest.deletedAt = new Date();
        featureRequest.deletedBy = userId;
        await featureRequest.save();

        return NextResponse.json({ success: true, message: "Request deleted" });
    } catch (error) {
        console.error("Error deleting feature request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete feature request" },
            { status: 500 }
        );
    }
}

// PATCH /api/feature-requests/[id] - Update a feature request
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();

        const { id } = await params;
        const body = await req.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid request ID" },
                { status: 400 }
            );
        }

        const featureRequest = await FeatureRequest.findById(id);

        if (!featureRequest || featureRequest.isDeleted) {
            return NextResponse.json(
                { success: false, error: "Feature request not found" },
                { status: 404 }
            );
        }

        // Only author can edit their request
        const userId = user.id;
        if (featureRequest.authorId !== userId) {
            return NextResponse.json(
                { success: false, error: "You can only edit your own requests" },
                { status: 403 }
            );
        }

        // Update allowed fields
        if (body.title) featureRequest.title = body.title.trim();
        if (body.description !== undefined) featureRequest.description = body.description.trim();

        await featureRequest.save();

        return NextResponse.json({ success: true, data: featureRequest });
    } catch (error) {
        console.error("Error updating feature request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update feature request" },
            { status: 500 }
        );
    }
}
