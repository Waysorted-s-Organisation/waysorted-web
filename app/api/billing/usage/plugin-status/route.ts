import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { recordProcessorReservationStatus } from "@/lib/billing/db";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type PluginStatusBody = {
  reservationId?: string;
  processor?: string;
  processorJobId?: string;
  status?: "accepted" | "completed" | "failed";
  reason?: string;
  metadata?: Record<string, unknown>;
};

const VALID_STATUSES = new Set(["accepted", "completed", "failed"]);

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as PluginStatusBody;
    const reservationId = body.reservationId?.trim() || "";
    const status = body.status?.trim() || "";

    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservationId." }, { status: 400 });
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid processor status." }, { status: 400 });
    }

    const reservation = await recordProcessorReservationStatus({
      userId: String(auth.user._id),
      reservationId,
      processor: body.processor?.trim() || null,
      processorJobId: body.processorJobId?.trim() || null,
      status: status as "accepted" | "completed" | "failed",
      reason: body.reason?.trim() || null,
      metadata: {
        source: "plugin",
        ...(body.metadata || {}),
      },
    });

    return NextResponse.json({
      ok: true,
      reservationId: String(reservation._id),
      status: reservation.metadata?.processorStatus || status,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/plugin-status error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record plugin processor status." },
      { status },
    );
  }
}
