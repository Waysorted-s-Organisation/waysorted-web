import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await FeatureRequest.find({
      "reports.reporterId": user.id,
    }).sort({ updatedAt: -1 });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/requests/reported error", err);
    return NextResponse.json(
      { message: "Failed to fetch reported requests" },
      { status: 500 }
    );
  }
}
