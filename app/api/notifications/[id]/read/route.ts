import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/models/notification";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(_req: Request, context: any) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const id = context?.params?.id;

        await dbConnect();

        const result = await Notification.updateOne(
            { _id: id, recipientId: user.id },
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
