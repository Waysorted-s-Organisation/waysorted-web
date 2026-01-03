import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Board from "@/models/Board";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        await dbConnect();
        const boards = await Board.find({ visibility: "public" }) // Filter?
            .sort({ createdAt: -1 });
        return NextResponse.json(boards);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await getCurrentUser();
        // Only admin can create boards? Or any user? Sujal's code didn't check usage but required ownerId
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await req.json();
        const board = await Board.create({
            ...data,
            ownerId: user._id.toString()
        });

        return NextResponse.json(board, { status: 201 });
    } catch (error) {
        console.error("POST /boards error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
