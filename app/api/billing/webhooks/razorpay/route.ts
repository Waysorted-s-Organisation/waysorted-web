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
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  try {
    const { webhookSecret } = getRazorpayConfig();
    const expectedSignature = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (!safeEqual(expectedSignature, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    await dbConnect();
    const eventId =
      request.headers.get("x-razorpay-event-id") ||
      String(payload.created_at || payload.event || Date.now());
    const eventType = String(payload.event || "unknown");

    const log = await recordIncomingWebhook({
      eventId,
      eventType,
      signature,
      payload,
    });

    if (log.status === "processed" || log.status === "ignored") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const claimedLog = await claimWebhookForProcessing(eventId);
    if (!claimedLog) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const result = await processRazorpayWebhook(payload);
    claimedLog.status = result && "ignored" in result && result.ignored ? "ignored" : "processed";
    claimedLog.processedAt = new Date();
    claimedLog.errorMessage = null;
    await claimedLog.save();

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("POST /api/billing/webhooks/razorpay error:", error);

    try {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const eventId =
        request.headers.get("x-razorpay-event-id") ||
        String(payload.created_at || payload.event || Date.now());
      await RazorpayEventLog.updateOne(
        { eventId },
        {
          $set: {
            status: "failed",
            processedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        },
      );
    } catch {
      // Ignore secondary logging failures.
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process webhook." },
      { status: 500 },
    );
  }
}
