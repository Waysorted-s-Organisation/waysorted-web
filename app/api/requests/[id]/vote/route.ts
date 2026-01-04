import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest, { type IFeatureRequest } from "@/models/featureRequest";
import Notification from "@/models/notification";
import { getCurrentUser } from "@/lib/user";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { message: "Login required to vote" },
                { status: 401 }
            );
        }

        await dbConnect();
        const doc = (await FeatureRequest.findById(
            params.id
        )) as IFeatureRequest | null;

        if (!doc || doc.isDeleted) {
            return NextResponse.json({ message: "Request not found" }, { status: 404 });
        }

        const userId = user.id;
        // votedBy might be undefined if old doc, ensure array
        if (!doc.votedBy) doc.votedBy = [];

        const alreadyVoted = doc.votedBy.includes(userId);

        if (alreadyVoted) {
            // Remove vote
            doc.votedBy = doc.votedBy.filter((id) => id !== userId);
            doc.votes = Math.max(0, doc.votes - 1);
        } else {
            // Add vote
            doc.votedBy.push(userId);
            doc.votes += 1;

            // Notify author if not self-vote
            if (doc.authorId && doc.authorId !== userId) {
                await Notification.create({
                    recipientId: doc.authorId,
                    type: "vote",
                    message: `${user.name || "Someone"} voted for your request: "${doc.title
                        }"`,
                    featureId: doc._id,
                    senderId: userId,
                    senderName: user.name,
                });
            }
        }

        await doc.save();
        return NextResponse.json({ data: doc });
    } catch (err) {
        console.error("POST /api/requests/:id/vote error", err);
        return NextResponse.json({ message: "Failed to vote" }, { status: 500 });
    }
}
