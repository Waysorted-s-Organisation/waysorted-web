import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import RazorpayEventLog from "@/models/razorpayEventLog";
import { getRazorpayConfig } from "@/lib/billing/env";
import {
  claimWebhookForProcessing,
  recordIncomingWebhook,
  processRazorpayWebhook,
} from "@/lib/billing/webhooks";
import { safeEqual } from "@/lib/billing/crypto";
import {
  isRetryableWebhookIgnoreReason,
  isTerminalWebhookStatus,
  deriveRazorpayEventId,
} from "@/lib/billing/webhook-processing";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

class RetryableWebhookError extends Error {
  readonly status = 503;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  let eventIdForFailure: string | null = null;
  let claimedLogId: string | null = null;
  let processingAttemptId: string | null = null;

  try {
    const { webhookSecret } = getRazorpayConfig();
    const expectedSignature = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (!safeEqual(expectedSignature, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    await dbConnect();
    const eventId = deriveRazorpayEventId(
      payload,
      request.headers.get("x-razorpay-event-id"),
    );
    if (!eventId) {
      return NextResponse.json(
        { error: "Webhook has no stable event identity." },
        { status: 400 },
      );
    }
    eventIdForFailure = eventId;
    const eventType = String(payload.event || "unknown");

    const log = await recordIncomingWebhook({
      eventId,
      eventType,
      signature,
      payload,
    });

    if (isTerminalWebhookStatus(log.status)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const claimedLog = await claimWebhookForProcessing(eventId);
    if (!claimedLog) {
      const currentLog = await RazorpayEventLog.findOne({ eventId }).select("status");
      if (isTerminalWebhookStatus(currentLog?.status)) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      return NextResponse.json(
        { error: "Webhook is already processing; retry later." },
        { status: 503, headers: { "Retry-After": "5" } },
      );
    }
    claimedLogId = String(claimedLog._id);
    processingAttemptId = claimedLog.processingAttemptId || null;
    if (!processingAttemptId) {
      throw new RetryableWebhookError("Webhook processing lease was not created.");
    }

    const result = await processRazorpayWebhook(payload);
    const ignored = Boolean(result && "ignored" in result && result.ignored);
    const resultReason = ignored && "reason" in result ? String(result.reason || "") : null;
    if (ignored && isRetryableWebhookIgnoreReason(resultReason)) {
      throw new RetryableWebhookError(
        `Webhook dependency is not ready: ${resultReason}.`,
      );
    }

    const finalized = await RazorpayEventLog.updateOne(
      { _id: claimedLogId, processingAttemptId },
      {
        $set: {
          status: ignored ? "ignored" : "processed",
          processedAt: new Date(),
          errorMessage: null,
          resultReason,
          processingAttemptId: null,
          processingStartedAt: null,
          processingLeaseExpiresAt: null,
        },
      },
    );
    if (finalized.modifiedCount !== 1) {
      throw new RetryableWebhookError("Webhook processing lease was lost; retry required.");
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("POST /api/billing/webhooks/razorpay error:", error);

    try {
      const eventId = eventIdForFailure;
      if (!eventId) throw new Error("Webhook event ID is unavailable.");
      await RazorpayEventLog.updateOne(
        processingAttemptId
          ? { eventId, processingAttemptId }
          : { eventId, status: { $in: ["received", "processing", "failed"] } },
        {
          $set: {
            status: "failed",
            processedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
            resultReason:
              error instanceof RetryableWebhookError
                ? "retryable_processing_failure"
                : "processing_failure",
            processingAttemptId: null,
            processingStartedAt: null,
            processingLeaseExpiresAt: null,
          },
        },
      );
    } catch {
      // Ignore secondary logging failures.
    }

    const status = error instanceof RetryableWebhookError ? error.status : 500;
    return NextResponse.json(
      { error: status === 503 ? "Webhook processing will be retried." : "Unable to process webhook." },
      {
        status,
        headers: status === 503 ? { "Retry-After": "5" } : undefined,
      },
    );
  }
}
