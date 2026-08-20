import Subscription from "@/models/subscription";
import Purchase from "@/models/purchase";
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
  /** Pending purchases settled from what the provider says was actually paid. */
  purchasesSettled: number;
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

/**
 * Records, against the local purchase, a payment the provider has already taken.
 *
 * Deliberately does NOT grant credits. It sets grantApplied so that
 * applyPurchaseCredits - which gates on `grantApplied: false` (db.ts:657-673) -
 * can never fire for this row afterwards. The cycle grant above is the single
 * owner of credits for a subscription; letting this path grant as well is how a
 * customer ends up credited twice for one payment.
 */
async function settlePaidSubscriptionPurchases(
  subscription: { _id: unknown; user: unknown },
  providerSubscriptionId: string,
  invoices: Array<Record<string, unknown>>,
): Promise<number> {
  const paid = invoices.filter(
    (invoice) => String(invoice.status) === "paid" && invoice.payment_id,
  );
  if (!paid.length) return 0;

  // Newest first: if several invoices are paid, the pending row belongs to the
  // most recent cycle, and an older payment id on it would misreport the charge.
  paid.sort((a, b) => Number(b.paid_at || 0) - Number(a.paid_at || 0));
  const settlement = paid[0];
  const paymentId = String(settlement.payment_id);
  const paidAt = settlement.paid_at ? new Date(Number(settlement.paid_at) * 1000) : new Date();

  // Conditional on still being unsettled, so a webhook that arrives while this
  // runs wins rather than being overwritten. Refunded rows are excluded for the
  // same reason webhooks.ts:187 excludes them: a late settlement must never
  // resurrect a refunded charge as paid.
  const result = await Purchase.updateOne(
    {
      razorpaySubscriptionId: providerSubscriptionId,
      user: subscription.user,
      status: { $in: ["pending", "created"] },
    },
    {
      $set: {
        status: "captured",
        capturedAt: paidAt,
        razorpayPaymentId: paymentId,
        // Credits for this cycle are granted above, by their own idempotent
        // path. Marking the grant applied is what stops this row being picked
        // up later and credited a second time.
        grantApplied: true,
        "notes.settledBy": "subscription-cycle-reconciliation",
        "notes.settledAt": new Date().toISOString(),
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.warn("[billing] settled a subscription purchase the webhook never delivered", {
      providerSubscriptionId,
      paymentId,
      userId: String(subscription.user),
    });
  }
  return result.modifiedCount;
}

export async function reconcileSubscriptionCycles(
  input: { limit?: number; lookbackMs?: number } = {},
): Promise<SubscriptionCycleReconciliationSummary> {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();

  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_LIMIT, 200));
  const lookbackCutoff = Date.now() - (input.lookbackMs ?? MAX_LOOKBACK_MS);

  const subscriptions = await Subscription.find({
    // "scheduled" and "payment_pending" are included deliberately. A discounted
    // subscription is future-dated, so it is created payment_pending and
    // promoted to scheduled - and rests there for its ENTIRE first cycle. With
    // only active/cancel_scheduled scanned, the one path that recovers a
    // payment the webhook never delivered could not see a coupon subscription
    // at all: money taken at the provider, no credits, no purchase settled, no
    // alert.
    status: { $in: ["active", "cancel_scheduled", "scheduled", "payment_pending"] },
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
    purchasesSettled: 0,
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

        // Dedupe on the PAYMENT, not on one exact key string.
        //
        // The webhook does not always key by payment: resolvePaidSubscriptionCycle falls back to
        // `invoice:<id>`, `period:<start>:<end>` or `paid-count:<n>` when the payload carries no
        // payment id, and an older revision keyed as `<sub>:<payment>` with no ":payment:" segment.
        // Probing a single string would therefore miss an existing grant and credit the cycle twice
        // - exactly how the first paying customer ended up with two grants for one payment.
        //
        // applySubscriptionCycleCredits records paymentId in the ledger row's metadata, so match on
        // that first, then fall back to the known key shapes.
        const candidateKeys = [
          `subscription-cycle:${subscription._id}:${cycleKey}`,
          `subscription-cycle:${subscription._id}:${providerSubscriptionId}:${paymentId}`,
          `subscription-cycle:${subscription._id}:${providerSubscriptionId}:invoice:${String(invoice.id)}`,
        ];

        const existing = await CreditLedger.exists({
          user: subscription.user,
          reason: "subscription_cycle_grant",
          $or: [
            { idempotencyKey: { $in: candidateKeys } },
            { "metadata.paymentId": paymentId },
          ],
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

      // Settle the purchase row for whatever the provider says was paid.
      //
      // Nothing else does this for a subscription. purchase-reconciliation
      // filters kind != "subscription" (:28), and subscription-reconciliation
      // only ever marks these FAILED, on expiry. So when a webhook does not
      // arrive - which is how the first paying customer's row sat "pending" for
      // over a week with a real payment against it - the money is collected at
      // the provider and never recorded locally. That is not a cosmetic gap:
      // revenue reporting, refunds and the receipt all key off this row.
      summary.purchasesSettled += await settlePaidSubscriptionPurchases(
        subscription,
        providerSubscriptionId,
        paidInvoices as Array<Record<string, unknown>>,
      );
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
