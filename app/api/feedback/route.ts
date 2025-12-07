import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import Feedback from "@/models/feedback";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rawRating = body?.rating;
    const rawComment = typeof body?.comment === "string" ? body.comment : "";

    let ratingValue: number | null = null;
    if (typeof rawRating === "number" && Number.isFinite(rawRating)) {
      if (rawRating >= 1 && rawRating <= 5) {
        ratingValue = Math.round(rawRating);
      } else if (rawRating >= 0 && rawRating <= 4) {
        ratingValue = Math.round(rawRating + 1);
      }
    }

    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const comment = rawComment.trim();
    if (comment.length > 500) {
      return NextResponse.json({ error: "Comment too long" }, { status: 400 });
    }

    await dbConnect();

    const user = await getCurrentUser();
    const headerStore = await headers();
    const referer = headerStore.get("referer") || undefined;
    const userAgent = headerStore.get("user-agent") || undefined;
    const path = (() => {
      if (!referer) return undefined;
      try {
        return new URL(referer).pathname;
      } catch (err) {
        console.error("Failed to parse referer", err);
        return undefined;
      }
    })();

    await Feedback.create({
      rating: ratingValue,
      comment: comment || undefined,
      isAnonymous: !user,
      userId: user ? (user.id as never) : undefined,
      userEmail: user?.email,
      userName: user?.name || undefined,
      path,
      userAgent,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json({ error: "Unable to submit feedback" }, { status: 500 });
  }
}