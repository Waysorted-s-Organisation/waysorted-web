import { NextRequest, NextResponse } from "next/server";
import { produceN4InactivityEvents } from "@/lib/n4-product-recall";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await produceN4InactivityEvents());
  } catch (error) {
    console.error("N4 inactivity scan failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "N4 inactivity scan failed" },
      { status: 500 },
    );
  }
}
