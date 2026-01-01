import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import { cookies } from "next/headers";

// Helper to get current user from session
async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/me`, {
            headers: { Cookie: `session_token=${sessionToken}` },
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user || null;
    } catch {
        return null;
    }
}

// GET /api/feature-requests - List all feature requests
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const board = searchParams.get("board");
        const sort = searchParams.get("sort") || "votes"; // votes, recent, random
        const mine = searchParams.get("mine") === "true";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { isDeleted: false };

        if (status) query.status = status;
        if (board) query.board = board;

        // If requesting own requests, need auth
        if (mine) {
            const user = await getCurrentUser();
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            query.authorId = user._id || user.id;
        }

        let sortOption = {};
        switch (sort) {
            case "recent":
                sortOption = { createdAt: -1 };
                break;
            case "random":
                // For random, we'll just use default and shuffle client-side
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { votes: -1, createdAt: -1 };
        }

        const requests = await FeatureRequest.find(query)
            .sort(sortOption)
            .lean();

        return NextResponse.json({ success: true, data: requests });
    } catch (error) {
        console.error("Error fetching feature requests:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch feature requests" },
            { status: 500 }
        );
    }
}

// POST /api/feature-requests - Create new feature request
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "You must be logged in to submit a request" },
                { status: 401 }
            );
        }

        await dbConnect();

        const body = await req.json();
        const { title, description, type, board } = body;

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "Title is required" },
                { status: 400 }
            );
        }

        const featureRequest = await FeatureRequest.create({
            title: title.trim(),
            description: description?.trim() || "",
            type: type || "feature",
            board: board || "general",
            authorId: user._id || user.id,
            authorName: user.name || user.email?.split("@")[0] || "Anonymous",
            authorEmail: user.email,
            status: "under_review",
            votes: 0,
            votedBy: [],
        });

        return NextResponse.json(
            { success: true, data: featureRequest },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating feature request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create feature request" },
            { status: 500 }
        );
    }
}
