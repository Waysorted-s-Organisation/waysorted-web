import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RequestComment from "@/models/requestComment";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, context: any) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { reason } = await req.json();
        const id = context?.params?.id;

        await dbConnect();
        const comment = await RequestComment.findById(id);
        if (!comment || comment.isDeleted) {
            return NextResponse.json({ message: "Comment not found" }, { status: 404 });
        }

        if (!comment.reports) comment.reports = [];
        comment.reports.push({
            reporterId: user.id,
            reason: reason || "no reason provided",
            createdAt: new Date(),
        });

        await comment.save();
        return NextResponse.json({
            data: {
                ok: true,
                commentId: comment._id,
                reportsCount: comment.reports.length,
            },
        });
    } catch (err) {
        console.error("POST /api/comments/:id/report error", err);
        return NextResponse.json({ message: "Failed to report comment" }, { status: 500 });
    }
}
