import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import {
  commitReservation,
  recordProcessorReservationStatus,
  releaseReservation,
  settleImportReservationPricing,
} from "@/lib/billing/db";
import { getProcessorCallbackSecret } from "@/lib/billing/env";
import { safeEqual, signValue, verifySignedToken } from "@/lib/billing/crypto";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ProcessorCallbackBody = {
  reservationId?: string;
  processor?: string;
  processorJobId?: string;
  status?: "accepted" | "completed" | "failed";
  reason?: string;
  compensateCommitted?: boolean;
  metadata?: Record<string, unknown>;
  actualSizeBytes?: number;
  importMode?: string;
};

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const rawBody = await request.text();
    const callbackSignature = request.headers.get("x-waysorted-callback-signature")?.trim() || "";
    const processorToken = request.headers.get("x-waysorted-processor-token")?.trim() || "";
    const secret = getProcessorCallbackSecret();

    if (!callbackSignature || !processorToken) {
      return NextResponse.json({ error: "Missing processor callback credentials." }, { status: 401 });
    }

    const expectedSignature = signValue(rawBody, secret);
    if (!safeEqual(expectedSignature, callbackSignature)) {
      return NextResponse.json({ error: "Invalid processor callback signature." }, { status: 401 });
    }

    const verifiedToken = verifySignedToken<{
      userId: string;
      reservationId: string;
      processor?: string | null;
      expiresAt: string;
    }>(processorToken, secret);

    if (!verifiedToken) {
      return NextResponse.json({ error: "Invalid processor token." }, { status: 401 });
    }

    if (Date.parse(verifiedToken.payload.expiresAt) <= Date.now()) {
      return NextResponse.json({ error: "Processor token expired." }, { status: 401 });
    }

    const body = (rawBody ? JSON.parse(rawBody) : {}) as ProcessorCallbackBody;
    const reservationId = body.reservationId?.trim() || verifiedToken.payload.reservationId;
    const status = body.status || "completed";

    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservationId." }, { status: 400 });
    }

    if (reservationId !== verifiedToken.payload.reservationId) {
      return NextResponse.json({ error: "Reservation mismatch." }, { status: 400 });
    }

    const reservation = await recordProcessorReservationStatus({
      userId: verifiedToken.payload.userId,
      reservationId,
      processor: body.processor?.trim() || verifiedToken.payload.processor || null,
      processorJobId: body.processorJobId?.trim() || null,
      status,
      reason: body.reason?.trim() || null,
      metadata: body.metadata || {},
    });

    if (status === "failed") {
      const releasedReservation = await releaseReservation({
        userId: verifiedToken.payload.userId,
        reservationId,
        reason: body.reason?.trim() || "processor_failed",
        compensateCommitted: body.compensateCommitted === true,
      });

      return NextResponse.json({
        ok: true,
        status: releasedReservation.status,
        reservationId,
      });
    }

    if (status === "completed") {
      if (reservation.featureCode.startsWith("import_")) {
        await settleImportReservationPricing({
          userId: verifiedToken.payload.userId,
          reservationId,
          actualSizeBytes: Number(body.actualSizeBytes),
          importMode: body.importMode?.trim() || null,
        });
      }
      const committedReservation = await commitReservation({
        userId: verifiedToken.payload.userId,
        reservationId,
        processorJobId: body.processorJobId?.trim() || null,
      });

      return NextResponse.json({
        ok: true,
        status: committedReservation.status,
        reservationId,
      });
    }

    return NextResponse.json({
      ok: true,
      status: reservation.status,
      reservationId,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/processor-callback error:", error);
    return billingErrorResponse(error, "Unable to reconcile processor callback.", "processor_callback_failed");
  }
}
