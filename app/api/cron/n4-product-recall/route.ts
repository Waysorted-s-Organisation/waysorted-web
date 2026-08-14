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

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const [n4, billing, webhookRecovery, reservationRecovery, subscriptionRecovery, ledgerAudit] = await Promise.allSettled([
      produceN4InactivityEvents(),
      reconcilePendingOneTimePurchases(),
      recoverStaleRazorpayWebhooks(),
      expireStaleReservations({ limit: 100 }),
      reconcileStalePendingSubscriptions(),
      inspectCreditLedgerConsistency(),
    ]);
    if (n4.status === "rejected") throw n4.reason;
    if (billing.status === "rejected") {
      console.error("Pending purchase reconciliation failed", {
        error: billing.reason instanceof Error
          ? billing.reason.message
          : String(billing.reason),
      });
    }
    if (webhookRecovery.status === "rejected") {
      console.error("Stale Razorpay webhook recovery failed", {
        error: webhookRecovery.reason instanceof Error
          ? webhookRecovery.reason.message
          : String(webhookRecovery.reason),
      });
    }

    return NextResponse.json({
      ...n4.value,
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
          ? { completed: true }
          : { unavailable: true },
      subscriptionRecovery:
        subscriptionRecovery.status === "fulfilled"
          ? subscriptionRecovery.value
          : { unavailable: true },
      ledgerAudit:
        ledgerAudit.status === "fulfilled"
          ? ledgerAudit.value
          : { unavailable: true },
    });
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
