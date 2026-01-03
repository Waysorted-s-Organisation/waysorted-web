import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import Board from "@/models/Board";

export async function GET() {
    await dbConnect();
    // Fetch requests not soft-deleted
    const requests = await FeatureRequest.find({ deletedAt: null })
        .populate("votes")
        .sort({ createdAt: -1 });

    return NextResponse.json(requests);
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        // Ensure we have a default board
        let boardId = body.boardId;
        if (!boardId) {
            // Find or create a default board
            let defaultBoard = await Board.findOne({ title: "General" });
            defaultBoard ??= await Board.create({
                title: "General",
                description: "General feature requests",
                visibility: "public",
                ownerId: body.userId || "system"
            });
            boardId = defaultBoard._id;
        }

        const request = await FeatureRequest.create({
            ...body,
            boardId,
            votes: [], // init empty
        });

        return NextResponse.json(request, { status: 201 });
    } catch (error) {
        console.error("Error creating request:", error);
        return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }
}
