import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const doc = await FeatureRequest.findById(params.id);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: doc });
  } catch (err) {
    console.error("GET /api/requests/:id error", err);
    return NextResponse.json({ message: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const doc = await FeatureRequest.findById(params.id);
    if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (doc.authorId !== user.id) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    doc.deletedBy = user.id;
    await doc.save();

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error("DELETE /api/requests/:id error", err);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
