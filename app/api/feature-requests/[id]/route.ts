import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const { id } = await params;

    const request = await FeatureRequest.findOne({ _id: id, deletedAt: null })
        .populate("votes.0");

    if (!request) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(request);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const { id } = await params;

    // Soft delete
    const request = await FeatureRequest.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
    );

    return NextResponse.json(request);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const request = await FeatureRequest.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(request);
}
