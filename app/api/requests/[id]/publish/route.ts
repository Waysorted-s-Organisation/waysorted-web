
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(_req: Request, context: any) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const params = await context?.params;
        const id = params?.id;

        if (!id) {
            return NextResponse.json({ message: "Missing ID" }, { status: 400 });
        }

        // Only admin can publish
        if (user.role !== "admin") {
            return NextResponse.json({ message: "Not allowed" }, { status: 403 });
        }

        await dbConnect();
        const doc = await FeatureRequest.findById(id);
        if (!doc) {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }

        doc.isPublic = true;
        doc.status = "planned"; // Usually publishing implies moving from 'under review' to 'planned' or keeping as is? 
        // The previous code implied just making it public. Let's stick to just isPublic for now, 
        // but usually a published request is 'planned' or 'open'. 
        // Let's just set isPublic = true.

        await doc.save();

        return NextResponse.json({ data: doc });
    } catch (err) {
        console.error("POST /api/requests/:id/publish error", err);
        return NextResponse.json({ message: "Failed to publish" }, { status: 500 });
    }
}
