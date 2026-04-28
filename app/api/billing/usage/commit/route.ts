import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { commitReservation } from "@/lib/billing/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type CommitBody = {
  reservationId?: string;
  idempotencyKey?: string;
  processorJobId?: string;
  bridgeToken?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CommitBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reservation = await commitReservation({
      userId: String(auth.user._id),
      reservationId: body.reservationId?.trim() || null,
      idempotencyKey: body.idempotencyKey?.trim() || null,
      processorJobId: body.processorJobId?.trim() || null,
    });

    return NextResponse.json({
      reservationId: String(reservation._id),
      status: reservation.status,
      committedAt: reservation.committedAt,
      processorJobId: reservation.processorJobId,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/commit error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to commit reservation." },
      { status },
    );
  }
}
