import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/notification";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Fetch notifications
        const notifications = await Notification.find({ recipientId: user.id })
            .sort({ createdAt: -1 })
            .limit(50); // limit to 50 for now

        const unreadCount = await Notification.countDocuments({
            recipientId: user.id,
            read: false,
        });

        return NextResponse.json({
            data: { notifications, unreadCount },
        });
    } catch (err) {
        console.error("GET /api/notifications error", err);
        return NextResponse.json(
            { message: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}
