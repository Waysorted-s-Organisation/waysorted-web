import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import UsageReservation from "@/models/usageReservation";
import { commitReservation, settleImportReservationPricing } from "@/lib/billing/db";
import {
  buildToolUsageCompletedEvent,
  buildToolUsageHeavyEvent,
  emitNotificationEvent,
  getHeavyUsageCreditThreshold,
} from "@/lib/notifications";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type CommitBody = {
  reservationId?: string;
  idempotencyKey?: string;
  processorJobId?: string;
  actualSizeBytes?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CommitBody;
    const auth = await getAuthenticatedUser(request);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reservationId = body.reservationId?.trim() || null;
    if (reservationId) {
      const existingReservation = await UsageReservation.findOne({
        _id: reservationId,
        user: String(auth.user._id),
      });
      if (
        existingReservation &&
        existingReservation.featureCode.startsWith("import_") &&
        existingReservation.metadata?.authoritativePricingApplied !== true
      ) {
        const actualSize =
          typeof body.actualSizeBytes === "number" && body.actualSizeBytes > 0
            ? body.actualSizeBytes
            : Number(existingReservation.selectedOptions?.clientDeclaredSizeBytes) || 0;

        if (actualSize > 0) {
          await settleImportReservationPricing({
            userId: String(auth.user._id),
            reservationId,
            actualSizeBytes: actualSize,
            importMode: (existingReservation.selectedOptions?.importMode as string) || null,
          });
        }
      }
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
    return billingErrorResponse(error, "Unable to commit reservation.", "reservation_commit_failed");
  }
}
