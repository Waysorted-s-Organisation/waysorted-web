import { NextRequest, NextResponse } from "next/server";
import Purchase from "@/models/purchase";
import { requireAdminUser } from "@/lib/billing/auth";
import { normalizeUtmAttribution } from "@/lib/utm-attribution";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "50"), 200);
    const requestedUtmSource = request.nextUrl.searchParams.get("utm_source");
    const utmSource = requestedUtmSource
      ? normalizeUtmAttribution({ utmSource: requestedUtmSource })?.utmSource
      : undefined;
    const purchases = await Purchase.find(
      utmSource ? { "attribution.utmSource": utmSource } : {},
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      { purchases },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("GET /api/admin/billing/purchases error:", error);
    return NextResponse.json({ error: "Unable to load purchases." }, { status: 500 });
  }
}
