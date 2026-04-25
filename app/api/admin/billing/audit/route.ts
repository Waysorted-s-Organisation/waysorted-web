import { NextRequest, NextResponse } from "next/server";
import RazorpayEventLog from "@/models/razorpayEventLog";
import { requireAdminUser } from "@/lib/billing/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "50"), 200);
    const events = await RazorpayEventLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/admin/billing/audit error:", error);
    return NextResponse.json({ error: "Unable to load billing audit." }, { status: 500 });
  }
}
