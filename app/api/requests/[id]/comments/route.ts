import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Comment from "@/models/comment";
import { getCurrentUser } from "@/lib/user";

// GET /api/requests/[id]/comments
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, context: any) {
  try {
    const params = await context?.params;
    const { id } = params;
    await dbConnect();

    // Fetch comments for this request
    const comments = await Comment.find({ requestId: id }).sort({ createdAt: 1 });
    return NextResponse.json({ data: comments });
  } catch (err) {
    console.error("GET comments error", err);
    return NextResponse.json({ message: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/requests/[id]/comments
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = await context?.params;
    const { id } = params;
    const body = await req.json();

    if (!body.text) return NextResponse.json({ message: "Text required" }, { status: 400 });

    await dbConnect();

    const newComment = await Comment.create({
      requestId: id,
      authorId: user.id,
      authorName: user.name || user.email.split("@")[0],
      authorInitials: user.initials || "U",
      text: body.text,
      parentId: body.parentId || null,
    });

    return NextResponse.json({ data: newComment });
  } catch (err) {
    console.error("POST comment error", err);
    return NextResponse.json({ message: "Failed to post" }, { status: 500 });
  }
}
