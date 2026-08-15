import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { releaseReservation } from "@/lib/billing/db";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ReleaseBody = {
  reservationId?: string;
  idempotencyKey?: string;
  reason?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ReleaseBody;
    const auth = await getAuthenticatedUser(request);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reservation = await releaseReservation({
      userId: String(auth.user._id),
      reservationId: body.reservationId?.trim() || null,
      idempotencyKey: body.idempotencyKey?.trim() || null,
      reason: body.reason?.trim() || null,
      // Customer-initiated: cannot free a hold the processor has already accepted.
      actor: "user",
    });

    return NextResponse.json({
      reservationId: String(reservation._id),
      status: reservation.status,
      releasedAt: reservation.releasedAt,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/release error:", error);
    return billingErrorResponse(error, "Unable to release reservation.", "reservation_release_failed");
  }
}
