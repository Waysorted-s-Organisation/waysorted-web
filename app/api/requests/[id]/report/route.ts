import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest, { type IFeatureRequest } from "@/models/featureRequest";
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
    const params = await context?.params;
    const id = params?.id;

    await dbConnect();
    const doc = (await FeatureRequest.findById(id)) as IFeatureRequest | null;

    if (!doc || doc.isDeleted) {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 });
    }

    if (!doc.reports) doc.reports = [];

    doc.reports.push({
      reporterId: user.id,
      reason: reason || "no reason provided",
      createdAt: new Date(),
    });

    await doc.save();
    return NextResponse.json({
      data: {
        ok: true,
        featureId: doc._id,
        reportsCount: doc.reports.length,
      },
    });
  } catch (err) {
    console.error("POST /api/requests/:id/report error", err);
    return NextResponse.json({ message: "Failed to report" }, { status: 500 });
  }
}
