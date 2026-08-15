import { NextRequest, NextResponse } from "next/server";
import {
  N4CanarySimulationError,
  produceN4CanarySimulation,
  produceN4InactivityEvents,
} from "@/lib/n4-product-recall";
import { validateN4CanaryTestTarget } from "@/lib/n4-canary-test";
import { reconcilePendingOneTimePurchases } from "@/lib/billing/purchase-reconciliation";
import { recoverStaleRazorpayWebhooks } from "@/lib/billing/webhook-recovery";
import { expireStaleReservations } from "@/lib/billing/db";
import { reconcileStalePendingSubscriptions } from "@/lib/billing/subscription-reconciliation";
import { inspectCreditLedgerConsistency } from "@/lib/billing/ledger-reconciliation";
import { reconcileSubscriptionCycles } from "@/lib/billing/subscription-cycle-reconciliation";
import { collectPaymentAlerts, emitPaymentAlerts } from "@/lib/billing/payment-alerts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// Reconciliation walks hundreds of documents and makes provider round trips; the default limit
// kills the run part-way and the unprocessed tail is never revisited.
export const maxDuration = 300;

type SettledJob = PromiseSettledResult<unknown>;

/**
 * Report a rejected background job. Every one of these was previously swallowed into
 * `{unavailable:true}` on an HTTP 200 response body that nothing reads, which is why a total
 * failure of the billing recovery layer looked healthy.
 */
function reportJobFailure(name: string, job: SettledJob) {
  if (job.status !== "rejected") return false;
  console.error(`[billing-cron] ${name} failed`, {
    error: job.reason instanceof Error ? job.reason.message : String(job.reason),
    stack: job.reason instanceof Error ? job.reason.stack : undefined,
  });
  return true;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(
    secret
    && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      n4,
      billing,
      webhookRecovery,
      reservationRecovery,
      subscriptionRecovery,
      cycleRecovery,
      ledgerAudit,
    ] = await Promise.allSettled([
      produceN4InactivityEvents(),
      reconcilePendingOneTimePurchases(),
      recoverStaleRazorpayWebhooks(),
      expireStaleReservations({ limit: 100 }),
      reconcileStalePendingSubscriptions(),
      // Renewal backstop: renewals are charged with no browser present, so the webhook is their
      // only delivery path. This asks Razorpay what it actually charged and fills any gaps.
      reconcileSubscriptionCycles(),
      inspectCreditLedgerConsistency(),
    ]);

    // A failure in the unrelated N4 marketing producer must not discard the billing report, which
    // carries the money-correctness signals. Record it and carry on.
    if (n4.status === "rejected") {
      reportJobFailure("n4-inactivity-producer", n4);
    }

    // Every billing job must be reported, not just the first two.
    const billingFailures = [
      reportJobFailure("purchase-reconciliation", billing),
      reportJobFailure("webhook-recovery", webhookRecovery),
      reportJobFailure("reservation-expiry", reservationRecovery),
      reportJobFailure("subscription-reconciliation", subscriptionRecovery),
      reportJobFailure("subscription-cycle-backstop", cycleRecovery),
      reportJobFailure("ledger-audit", ledgerAudit),
    ].filter(Boolean).length;

    // Turn money-correctness signals into something a human sees.
    const alerts = await collectPaymentAlerts({
      cycleSummary: cycleRecovery.status === "fulfilled" ? cycleRecovery.value : null,
      ledgerAudit: ledgerAudit.status === "fulfilled" ? ledgerAudit.value : null,
    }).catch((error) => {
      console.error("[billing-cron] alert collection failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    });
    const alertResult = await emitPaymentAlerts(alerts);

    // Ledger drift is the one signal that says "credits and money disagree". Previously it was
    // computed and dropped into a response body nobody reads.
    if (ledgerAudit.status === "fulfilled") {
      const audit = ledgerAudit.value as {
        mismatched?: number;
        purchaseGrantLedgerMissing?: number;
        mismatchedUsers?: string[];
        missingLedgerPurchases?: string[];
      };
      if ((audit?.mismatched ?? 0) > 0 || (audit?.purchaseGrantLedgerMissing ?? 0) > 0) {
        console.error("[billing-cron] LEDGER DRIFT DETECTED", {
          mismatched: audit.mismatched,
          purchaseGrantLedgerMissing: audit.purchaseGrantLedgerMissing,
          mismatchedUsers: audit.mismatchedUsers,
          missingLedgerPurchases: audit.missingLedgerPurchases,
        });
      }
    }

    // Surface a non-200 so the platform's cron history shows the failure instead of a green run.
    const responseStatus = billingFailures > 0 || alerts.length > 0 ? 500 : 200;

    return NextResponse.json({
      billingFailures,
      alerts: { raised: alerts.length, delivered: alertResult.delivered },
      ...(n4.status === "fulfilled" ? n4.value : { n4: { unavailable: true } }),
      billingReconciliation:
        billing.status === "fulfilled"
          ? billing.value
          : { unavailable: true },
      webhookRecovery:
        webhookRecovery.status === "fulfilled"
          ? webhookRecovery.value
          : { unavailable: true },
      reservationRecovery:
        reservationRecovery.status === "fulfilled"
          ? reservationRecovery.value
          : { unavailable: true },
      subscriptionRecovery:
        subscriptionRecovery.status === "fulfilled"
          ? subscriptionRecovery.value
          : { unavailable: true },
      subscriptionCycleBackstop:
        cycleRecovery.status === "fulfilled"
          ? cycleRecovery.value
          : { unavailable: true },
      ledgerAudit:
        ledgerAudit.status === "fulfilled"
          ? ledgerAudit.value
          : { unavailable: true },
    }, { status: responseStatus });
  } catch (error) {
    console.error("N4 inactivity scan failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "N4 inactivity scan failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const target = validateN4CanaryTestTarget({
    enabled: process.env.NOTIFICATION_N4_CANARY_TEST_ENABLED,
    allowlist: process.env.NOTIFICATION_N4_PRODUCER_CANARY_EMAILS,
    requestedEmail: body?.email,
  });
  if (!target.ok) {
    return NextResponse.json(
      { error: target.error },
      { status: target.status },
    );
  }

  try {
    return NextResponse.json(await produceN4CanarySimulation(target.email));
  } catch (error) {
    if (error instanceof N4CanarySimulationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("N4 canary simulation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "N4 canary simulation failed" },
      { status: 500 },
    );
  }
}
