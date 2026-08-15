import Subscription from "@/models/subscription";
import CreditLedger from "@/models/creditLedger";
import dbConnect from "@/lib/db";
import { applySubscriptionCycleCredits } from "@/lib/billing/db";
import { fetchRazorpaySubscriptionInvoices } from "@/lib/billing/razorpay";
import { buildSubscriptionCycleKey } from "@/lib/billing/webhook-payload";

/**
 * Renewal backstop: deliver subscription credits Razorpay charged for but never told us about.
 *
 * The first cycle has two independent delivery paths - /subscriptions/verify (browser present) and
 * the subscription.charged webhook. Every renewal after that has only the webhook: Razorpay debits
 * the mandate with no browser involved, so a single lost delivery means the customer is charged and
 * receives nothing, permanently.
 *
 * Nothing else recovers it. reconcileStalePendingSubscriptions confirms the subscription is active
 * and marks it active WITHOUT granting credits, so the account looks entitled while the wallet stays
 * flat. webhook-recovery cannot replay, because the payload sanitizer discards the fields a replay
 * would need. And the drift audit only checks Purchase rows, which renewals never create.
 *
 * So instead of waiting to be told, this asks Razorpay what it actually charged and fills the gaps.
 * Safe to run repeatedly: it reuses the cycle key the webhook would have used, and the unique index
 * on creditledgers.idempotencyKey makes whichever path arrives second a no-op.
 */

const DEFAULT_LIMIT = 50;
/** Ignore invoices older than this; they predate the wallet and are not worth re-granting. */
const MAX_LOOKBACK_MS = 120 * 24 * 60 * 60_000;

export type SubscriptionCycleReconciliationSummary = {
  scanned: number;
  granted: number;
  alreadyPresent: number;
  failed: number;
  /** Cycles found paid at the provider with no ledger row - i.e. money taken, nothing delivered. */
  missingDeliveries: Array<{
    userId: string;
    subscriptionId: string;
    paymentId: string;
    invoiceId: string;
    amountPaid: number | null;
    currency: string | null;
  }>;
};

export { buildSubscriptionCycleKey };

export async function reconcileSubscriptionCycles(
  input: { limit?: number; lookbackMs?: number } = {},
): Promise<SubscriptionCycleReconciliationSummary> {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();

  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_LIMIT, 200));
  const lookbackCutoff = Date.now() - (input.lookbackMs ?? MAX_LOOKBACK_MS);

  const subscriptions = await Subscription.find({
    status: { $in: ["active", "cancel_scheduled"] },
    // Only real Razorpay subscriptions. Admin-granted entitlements carry a synthetic id such as
    // `manual-premium:<date>:<email>:<plan>`, which the provider knows nothing about - querying it
    // would fail on every run, permanently reporting the cron as failed and burying real problems.
    providerSubscriptionId: { $regex: /^sub_/ },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);

  const summary: SubscriptionCycleReconciliationSummary = {
    scanned: subscriptions.length,
    granted: 0,
    alreadyPresent: 0,
    failed: 0,
    missingDeliveries: [],
  };

  for (const subscription of subscriptions) {
    const providerSubscriptionId = String(subscription.providerSubscriptionId);
    try {
      const response = await fetchRazorpaySubscriptionInvoices(providerSubscriptionId);
      const paidInvoices = (response.items || []).filter((invoice) => {
        if (String(invoice.status || "").toLowerCase() !== "paid") return false;
        if (!invoice.payment_id) return false;
        // paid_at is epoch seconds.
        if (invoice.paid_at && invoice.paid_at * 1000 < lookbackCutoff) return false;
        return true;
      });

      for (const invoice of paidInvoices) {
        const paymentId = String(invoice.payment_id);
        const cycleKey = buildSubscriptionCycleKey(providerSubscriptionId, paymentId);

        const existing = await CreditLedger.exists({
          idempotencyKey: `subscription-cycle:${subscription._id}:${cycleKey}`,
        });
        if (existing) {
          summary.alreadyPresent += 1;
          continue;
        }

        // Money moved at the provider and nothing was delivered locally. Record it before granting,
        // so the number is reportable even if the grant itself then fails.
        summary.missingDeliveries.push({
          userId: String(subscription.user),
          subscriptionId: providerSubscriptionId,
          paymentId,
          invoiceId: String(invoice.id),
          amountPaid: typeof invoice.amount_paid === "number" ? invoice.amount_paid : null,
          currency: invoice.currency || null,
        });

        await applySubscriptionCycleCredits({
          subscription,
          cycleKey,
          paymentId,
        });
        summary.granted += 1;
      }
    } catch (error) {
      summary.failed += 1;
      console.error("[billing] subscription cycle reconciliation failed", {
        subscriptionId: providerSubscriptionId,
        user: String(subscription.user),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}
