import Purchase from "@/models/purchase";
import dbConnect from "@/lib/db";
import type { SubscriptionCycleReconciliationSummary } from "@/lib/billing/subscription-cycle-reconciliation";

/**
 * Turn "money is wrong" into something a human actually sees.
 *
 * Before this, every money-correctness signal in the stack terminated in console.error inside a
 * background job whose output nobody reads, so a total failure of the recovery layer produced a
 * green cron run. These checks produce one loud, greppable line with the affected records, and a
 * non-zero count that the cron surfaces in its HTTP status.
 *
 * Wire ALERT_WEBHOOK_URL to a Slack/Discord incoming webhook to have it delivered; without it the
 * signal still reaches the platform logs in a form that can be alerted on by a log query.
 */

const PAID_BUT_UNFULFILLED_GRACE_MS = 15 * 60_000;

export type PaymentAlert = {
  kind:
    | "paid_not_fulfilled"
    | "subscription_cycle_missing"
    | "ledger_drift"
    | "recovery_job_failing";
  severity: "critical" | "warning";
  message: string;
  details: Record<string, unknown>;
};

/** Per-item failure counters reported by the reconcilers. */
export type JobHealth = { name: string; scanned?: number; failed?: number; rejected?: boolean };

/**
 * Purchases where the money was captured but the credits were never applied.
 *
 * This single number IS "customer paid and got nothing". It should always be zero.
 */
export async function findPaidButUnfulfilledPurchases(graceMs = PAID_BUT_UNFULFILLED_GRACE_MS) {
  await dbConnect();
  const cutoff = new Date(Date.now() - graceMs);
  return Purchase.find({
    status: "captured",
    grantApplied: false,
    capturedAt: { $lte: cutoff },
  })
    .select("user productCode amountPaise currency razorpayOrderId razorpayPaymentId capturedAt")
    .limit(50)
    .lean();
}

export async function collectPaymentAlerts(input: {
  cycleSummary?: SubscriptionCycleReconciliationSummary | null;
  ledgerAudit?: { mismatched?: number; mismatchedUsers?: string[] } | null;
  jobs?: JobHealth[];
}): Promise<PaymentAlert[]> {
  const alerts: PaymentAlert[] = [];

  // A reconciler that catches every per-item error still FULFILLS, so the job never registers as a
  // rejection and the cron stays green. That means the recovery layer can be entirely dead - a
  // rotated Razorpay key, an outage, a rate limit - while reporting success every night, which is
  // precisely the failure mode this whole effort started from.
  const failingJobs = (input.jobs || []).filter(
    (job) => job.rejected || (job.failed ?? 0) > 0,
  );
  if (failingJobs.length) {
    const totallyDead = failingJobs.filter(
      (job) => job.rejected || ((job.scanned ?? 0) > 0 && job.failed === job.scanned),
    );
    alerts.push({
      kind: "recovery_job_failing",
      severity: totallyDead.length ? "critical" : "warning",
      message: totallyDead.length
        ? `${totallyDead.length} recovery job(s) failed completely - the recovery layer is not working`
        : `${failingJobs.length} recovery job(s) reported item failures`,
      details: { jobs: failingJobs },
    });
  }

  const unfulfilled = await findPaidButUnfulfilledPurchases();
  if (unfulfilled.length) {
    alerts.push({
      kind: "paid_not_fulfilled",
      severity: "critical",
      message: `${unfulfilled.length} purchase(s) captured but never credited`,
      details: {
        purchases: unfulfilled.map((p) => {
          const row = p as unknown as Record<string, unknown>;
          return {
            purchaseId: String(row._id),
            user: String(row.user),
            productCode: row.productCode,
            amount: `${row.currency} ${(Number(row.amountPaise || 0) / 100).toFixed(2)}`,
            razorpayPaymentId: row.razorpayPaymentId,
          };
        }),
      },
    });
  }

  // A renewal the provider charged for that had no ledger row until the backstop filled it in.
  // Non-zero means the webhook path is dropping deliveries and should be investigated.
  const missing = input.cycleSummary?.missingDeliveries ?? [];
  if (missing.length) {
    alerts.push({
      kind: "subscription_cycle_missing",
      severity: "critical",
      message: `${missing.length} subscription cycle(s) were paid at Razorpay with no credits delivered`,
      details: { cycles: missing },
    });
  }

  if ((input.ledgerAudit?.mismatched ?? 0) > 0) {
    alerts.push({
      kind: "ledger_drift",
      severity: "warning",
      message: `${input.ledgerAudit?.mismatched} wallet(s) disagree with their credit ledger`,
      details: { users: input.ledgerAudit?.mismatchedUsers ?? [] },
    });
  }

  return alerts;
}

/**
 * Emit alerts. Always logs; additionally posts to ALERT_WEBHOOK_URL when configured.
 * Never throws - an alerting failure must not take down the job that produced the signal.
 */
export async function emitPaymentAlerts(alerts: PaymentAlert[]) {
  if (!alerts.length) return { delivered: false, count: 0 };

  for (const alert of alerts) {
    console.error(`[billing-alert][${alert.severity}][${alert.kind}] ${alert.message}`, alert.details);
  }

  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  if (!url) return { delivered: false, count: alerts.length };

  try {
    const text = alerts
      .map((a) => `*[${a.severity.toUpperCase()}] ${a.kind}*\n${a.message}\n\`\`\`${JSON.stringify(a.details, null, 2).slice(0, 2500)}\`\`\``)
      .join("\n\n");
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `Waysorted billing alert\n\n${text}` }),
    });
    return { delivered: true, count: alerts.length };
  } catch (error) {
    console.error("[billing-alert] failed to deliver alert webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { delivered: false, count: alerts.length };
  }
}
