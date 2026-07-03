import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { commitReservation } from "@/lib/billing/db";
import {
  buildToolUsageCompletedEvent,
  buildToolUsageHeavyEvent,
  emitNotificationEvent,
  getHeavyUsageCreditThreshold,
} from "@/lib/notifications";

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

    const usageEventInput = {
      userId: String(auth.user._id),
      email: auth.user.email,
      name: auth.user.name || null,
      reservationId: String(reservation._id),
      featureCode: reservation.featureCode,
      toolCode: reservation.toolCode || null,
      creditsReserved: reservation.creditsReserved,
      processor: reservation.processor || null,
      processorJobId: reservation.processorJobId || null,
    };
    const notificationEvents = [
      emitNotificationEvent(buildToolUsageCompletedEvent(usageEventInput)),
    ];
    const heavyUsageThreshold = getHeavyUsageCreditThreshold();
    if (reservation.creditsReserved >= heavyUsageThreshold) {
      notificationEvents.push(
        emitNotificationEvent(buildToolUsageHeavyEvent({
          ...usageEventInput,
          thresholdCredits: heavyUsageThreshold,
        }))
      );
    }

    await Promise.all(notificationEvents);

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
