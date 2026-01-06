import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/notification";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        await Notification.updateMany(
            { recipientId: user.id, read: false },
            { $set: { read: true } }
        );

        return NextResponse.json({ data: { ok: true } });
    } catch (err) {
        console.error("PUT /api/notifications/read-all error", err);
        return NextResponse.json(
            { message: "Failed to mark all as read" },
            { status: 500 }
        );
    }
}
