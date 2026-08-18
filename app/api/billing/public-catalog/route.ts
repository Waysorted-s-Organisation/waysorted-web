import { NextRequest, NextResponse } from "next/server";
import { buildPublicCatalog } from "@/lib/billing/public-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const payload = buildPublicCatalog(request.headers);

  return NextResponse.json(
    payload,
    {
      headers: {
        "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    },
  );
}
