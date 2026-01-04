import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RequestComment from "@/models/requestComment";
import FeatureRequest from "@/models/featureRequest";
import Notification from "@/models/notification";
import { getCurrentUser } from "@/lib/user";
import { saveAttachmentsFromFormData, parseString } from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    // Allow viewing comments even if guest, but logic might vary. 
    // Usually fetching comments is public or semi-public.

    await dbConnect();
    // Fetch comments for this featureId, sorted by createdAt desc
    const comments = await RequestComment.find({
      featureId: params.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ data: comments });
  } catch (err) {
    console.error("GET /api/requests/:id/comments error", err);
    return NextResponse.json({ message: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { message: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const text = parseString(formData.get("text")).trim();
    if (!text) {
      return NextResponse.json({ message: "Text is required" }, { status: 400 });
    }
    const parent = parseString(formData.get("parent")) || null;
    const attachments = await saveAttachmentsFromFormData(formData);

    await dbConnect();
    const featureRequest = await FeatureRequest.findById(params.id);
    if (!featureRequest || featureRequest.isDeleted) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 });
    }

    const comment = await RequestComment.create({
      featureId: params.id,
      authorId: user.id,
      authorName: user.name || user.email,
      text,
      parent,
      attachments,
    });

    // Notify feature author if different from commenter
    if (featureRequest.authorId && featureRequest.authorId !== user.id) {
      await Notification.create({
        recipientId: featureRequest.authorId,
        type: "comment",
        message: `${user.name || "Someone"} commented on your request: "${featureRequest.title}"`,
        featureId: featureRequest._id,
        commentId: comment._id,
        senderId: user.id,
        senderName: user.name
      });
    }

    // Increment comments count on feature request
    featureRequest.commentsCount = (featureRequest.commentsCount || 0) + 1;
    await featureRequest.save();

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (err) {
    console.error("POST /api/requests/:id/comments error", err);
    return NextResponse.json({ message: "Failed to create comment" }, { status: 500 });
  }
}
