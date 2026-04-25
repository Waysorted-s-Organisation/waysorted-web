import { NextRequest, NextResponse } from "next/server";
import Purchase from "@/models/purchase";
import { requireAdminUser } from "@/lib/billing/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "50"), 200);
    const purchases = await Purchase.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("GET /api/admin/billing/purchases error:", error);
    return NextResponse.json({ error: "Unable to load purchases." }, { status: 500 });
  }
}
