import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: Request, context: any) {
  try {
    const params = await context?.params;
    const id = params?.id;
    await dbConnect();
    const doc = await FeatureRequest.findById(id);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: doc });
  } catch (err) {
    console.error("GET /api/requests/:id error", err);
    return NextResponse.json({ message: "Failed to fetch" }, { status: 500 });
  }
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = await context?.params;
    const id = params?.id;

    await dbConnect();
    const doc = await FeatureRequest.findById(id);
    if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
    
    // Allow admin or author to delete
    const isAdmin = user.role === "admin";
    if (!isAdmin && doc.authorId !== user.id) {
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
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: Request, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = await context?.params;
    const id = params?.id;
    const body = await req.json();

    await dbConnect();
    const doc = await FeatureRequest.findById(id);
    if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isAdmin = user.role === "admin";
    
    // Author can update title/description, admin can update status and publish
    if (isAdmin) {
      // Admin can update status and other fields
      if (body.status) doc.status = body.status;
      if (body.title) doc.title = body.title;
      if (body.description !== undefined) doc.description = body.description;
    } else {
      // Author can only update title and description
      if (doc.authorId !== user.id) {
        return NextResponse.json({ message: "Not allowed" }, { status: 403 });
      }
      if (body.title) doc.title = body.title;
      if (body.description !== undefined) doc.description = body.description;
    }

    await doc.save();

    return NextResponse.json({ data: doc });
  } catch (err) {
    console.error("PUT /api/requests/:id error", err);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}
