import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
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
    const data = await FeatureRequest.find({
      authorId: user.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/requests/mine error", err);
    return NextResponse.json(
      { message: "Failed to fetch my requests" },
      { status: 500 }
    );
  }
}
