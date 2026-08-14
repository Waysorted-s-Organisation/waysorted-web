import RazorpayEventLog from "@/models/razorpayEventLog";
import { WEBHOOK_PROCESSING_LEASE_MS } from "@/lib/billing/webhook-processing";
import dbConnect from "@/lib/db";

export async function recoverStaleRazorpayWebhooks(input: {
  now?: Date;
  legacyStaleMs?: number;
} = {}) {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();
  const now = input.now || new Date();
  const legacyStaleCutoff = new Date(
    now.getTime() - (input.legacyStaleMs ?? WEBHOOK_PROCESSING_LEASE_MS),
  );

  const recovered = await RazorpayEventLog.updateMany(
    {
      status: "processing",
      $or: [
        { processingLeaseExpiresAt: { $lte: now } },
        {
          processingLeaseExpiresAt: null,
          updatedAt: { $lte: legacyStaleCutoff },
        },
      ],
    },
    {
      $set: {
        status: "failed",
        processedAt: now,
        errorMessage: "Processing lease expired; awaiting provider retry.",
        resultReason: "processing_lease_expired",
        processingAttemptId: null,
        processingStartedAt: null,
        processingLeaseExpiresAt: null,
      },
    },
  );

  const awaitingRetry = await RazorpayEventLog.countDocuments({ status: "failed" });
  return {
    recovered: recovered.modifiedCount,
    awaitingRetry,
  };
}
