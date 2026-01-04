import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/notification";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const result = await Notification.updateOne(
            { _id: params.id, recipientId: user.id },
            { $set: { read: true } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { message: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: { ok: true } });
    } catch (err) {
        console.error("PUT /api/notifications/:id/read error", err);
        return NextResponse.json(
            { message: "Failed to mark as read" },
            { status: 500 }
        );
    }
}
