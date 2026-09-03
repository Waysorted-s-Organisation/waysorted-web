import type { FilterQuery, HydratedDocument } from "mongoose";
import Subscription from "@/models/subscription";
import type { ISubscription, SubscriptionStatus } from "@/models/subscription";
import Purchase from "@/models/purchase";
import CreditLedger from "@/models/creditLedger";
import dbConnect from "@/lib/db";
import { applySubscriptionCycleCredits } from "@/lib/billing/db";
import { fetchRazorpaySubscriptionInvoices } from "@/lib/billing/razorpay";
import { buildSubscriptionCycleKey } from "@/lib/billing/webhook-payload";
import { claimRedemptionForSettledPurchase } from "@/lib/billing/coupon";

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
 *
 * Which rows it looks at each run is itself load-bearing - see selectSubscriptionsToScan.
 */

const DEFAULT_LIMIT = 50;
/** Ignore invoices older than this; they predate the wallet and are not worth re-granting. */
const MAX_LOOKBACK_MS = 120 * 24 * 60 * 60_000;

/**
 * Statuses a subscription rests in while the provider can still charge it.
 *
 * "scheduled" and "payment_pending" are included deliberately. A discounted subscription is
 * future-dated, so it is created payment_pending and promoted to scheduled - and rests there for its
 * ENTIRE first cycle. With only active/cancel_scheduled scanned, the one path that recovers a
 * payment the webhook never delivered could not see a coupon subscription at all: money taken at the
 * provider, no credits, no purchase settled, no alert.
 */
const LIVE_STATUSES: SubscriptionStatus[] = ["active", "cancel_scheduled", "scheduled", "payment_pending"];

/**
 * How recently a subscription must have been created to jump the queue on age alone.
 *
 * Covers the first-cycle window where /subscriptions/verify has already handed the customer a 202
 * and promised the subscription "will activate automatically", but the Purchase row has not been
 * written yet or its provider id is still missing.
 */
const RECENT_SIGNUP_MS = 48 * 60 * 60_000;

/**
 * How long a quiet subscription may go unscanned before the slow sweep looks at it again.
 *
 * The due-cycle tier below cannot see a MIDDLE cycle that was missed - if the webhook for cycle 2 is
 * lost but cycle 3 arrives, nextChargeAt is pushed into the future and the gap becomes invisible.
 * Nothing else in the stack looks at renewals, so that customer would silently lose a month of
 * credits forever. This sweep is what eventually finds it; it only ever spends slots the urgent
 * tiers did not use.
 */
const COLD_SCAN_MS = 7 * 24 * 60 * 60_000;

/**
 * Largest share of one run the freshness tier may spend before the renewal tiers get their turn.
 *
 * The freshness tier selects on AGE, not on evidence of outstanding work, so unlike the tiers below
 * it does not shrink as customers are served. Past `limit` signups per RECENT_SIGNUP_MS it fills
 * every slot by itself on every run - the cron is daily and takes 50 rows, so roughly 25 signups a
 * day is enough - and the due-cycle and cold sweeps below then never execute again. Renewals are
 * charged with no browser present and the webhook is their only delivery path, so that would
 * silently retire the backstop this module exists to be, in exactly the growth case that makes a
 * dropped renewal expensive. Whatever the later tiers leave unused is handed straight back to the
 * freshest rows, so the cap costs nothing on a quiet night.
 */
const FRESH_TIER_SHARE = 0.6;

type SubscriptionDoc = HydratedDocument<ISubscription>;

/**
 * Provider ids whose subscription Purchase is still unsettled.
 *
 * Mirrors how purchase-reconciliation drives off the Purchase collection instead of walking every
 * live row - except inverted, because that reconciler filters `kind != "subscription"` and so never
 * touches these. An unsettled row is the strongest available evidence that money moved and nothing
 * was recorded, which makes it the right head of the queue.
 */
async function findUnsettledProviderSubscriptionIds(limit: number): Promise<string[]> {
  const rows = await Purchase.find({
    kind: "subscription",
    status: { $in: ["pending", "created"] },
    razorpaySubscriptionId: { $nin: [null, ""] },
  })
    .select("razorpaySubscriptionId")
    // Newest first: a backlog of old unsettled rows must not push the checkout that just returned
    // 202 out of the window, because that customer is waiting on this run right now.
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const ids = new Set<string>();
  for (const row of rows) {
    const id = String(row.razorpaySubscriptionId || "");
    if (id.startsWith("sub_")) ids.add(id);
  }
  return [...ids];
}

/**
 * Choose which subscriptions are worth a provider round trip this run, most urgent first.
 *
 * The previous query took the `limit` oldest-updated live subscriptions, and a clean scan writes
 * NOTHING to the Subscription document - the ledger-exists check continues,
 * applySubscriptionCycleCredits returns early on the duplicate key, and
 * settlePaidSubscriptionPurchases only touches the Purchase collection. So updatedAt never advanced
 * and the same fifty oldest rows were rescanned every night forever. Past fifty live subscribers a
 * brand-new coupon subscription has the NEWEST updatedAt and was never reached at all - which is
 * precisely the row /subscriptions/verify promises will be settled automatically when it returns
 * 202 payment_processing to a UPI customer. Money captured at Razorpay, purchase stuck pending, no
 * credits, no receipt, and because it was never scanned it never reached missingDeliveries either,
 * so no alert fired.
 *
 * Two things fix that. The set is narrowed to rows that can actually have work, so it shrinks as
 * subscribers are served rather than growing with every happy long-lived one; and what remains is
 * ordered urgent-first with a real round-robin cursor (metadata.cycleScanAt) behind it, so a row is
 * pushed to the back of the queue by being scanned rather than by being repaired.
 */
async function selectSubscriptionsToScan(limit: number): Promise<SubscriptionDoc[]> {
  const now = Date.now();
  const base: FilterQuery<ISubscription> = {
    status: { $in: LIVE_STATUSES },
    // Only real Razorpay subscriptions. Admin-granted entitlements carry a synthetic id such as
    // `manual-premium:<date>:<email>:<plan>`, which the provider knows nothing about - querying it
    // would fail on every run, permanently reporting the cron as failed and burying real problems.
    providerSubscriptionId: { $regex: /^sub_/ },
  };

  const picked = new Map<string, SubscriptionDoc>();
  const take = (rows: SubscriptionDoc[]) => {
    for (const row of rows) {
      if (picked.size >= limit) return;
      picked.set(String(row._id), row);
    }
  };

  // Tier 1 - freshness. A row with an unsettled Purchase, or one signed up in the last couple of
  // days, is the case the 202 response depends on, so it is served FIRST. Any ascending
  // "last touched" ordering serves the just-paid row LAST, which is the wrong end of the queue.
  const unsettledIds = await findUnsettledProviderSubscriptionIds(Math.min(limit * 4, 200));
  const unsettled = new Set(unsettledIds);
  const freshOr: FilterQuery<ISubscription>[] = [
    { createdAt: { $gte: new Date(now - RECENT_SIGNUP_MS) } },
  ];
  if (unsettledIds.length) {
    freshOr.push({ providerSubscriptionId: { $in: unsettledIds } });
  }
  const fresh = await Subscription.find({ ...base, $or: freshOr }).sort({ createdAt: -1 }).limit(limit);

  // Put the unsettled-Purchase rows at the head for real. Branch order inside `$or` carries no
  // ordering in MongoDB, so with a plain `createdAt: -1` sort a subscription whose payment has been
  // sitting uncredited for a month ranks BELOW every fresh signup - and the budget below would then
  // cut off the one row we have hard evidence took the customer's money and delivered nothing.
  // Array.prototype.sort is stable, so newest-first still holds inside each group.
  fresh.sort(
    (a, b) => Number(unsettled.has(b.providerSubscriptionId)) - Number(unsettled.has(a.providerSubscriptionId)),
  );
  take(fresh.slice(0, Math.max(1, Math.floor(limit * FRESH_TIER_SHARE))));

  // Tier 2 - a charge that is due or overdue with no grant behind it. A subscriber whose renewal
  // webhook landed has nextChargeAt pushed into the future by webhooks.ts, so the happy path drops
  // straight out of the set. The field-to-field compare needs $expr, and it is what lets a row leave
  // once THIS backstop has filled the gap - otherwise every rescued renewal would sit here forever,
  // since nothing advances nextChargeAt on the recovery path.
  if (picked.size < limit) {
    take(
      await Subscription.find({
        ...base,
        _id: { $nin: [...picked.keys()] },
        $or: [
          {
            nextChargeAt: { $ne: null, $lte: new Date(now) },
            $expr: { $lt: [{ $ifNull: ["$lastCreditsGrantedAt", new Date(0)] }, "$nextChargeAt"] },
          },
          // No schedule recorded at all - we cannot prove there is nothing to collect.
          { nextChargeAt: null },
        ],
      })
        .sort({ "metadata.cycleScanAt": 1, createdAt: -1 })
        .limit(limit - picked.size),
    );
  }

  // Tier 3 - slow full-coverage rotation, on leftover slots only. Least-recently-scanned first, and
  // a missing stamp sorts first, so no row can be starved the way the old updatedAt ordering starved
  // everything past the first fifty.
  if (picked.size < limit) {
    const coldCutoff = new Date(now - COLD_SCAN_MS);
    take(
      await Subscription.find({
        ...base,
        _id: { $nin: [...picked.keys()] },
        $or: [
          { "metadata.cycleScanAt": null },
          { "metadata.cycleScanAt": { $lte: coldCutoff } },
        ],
      })
        .sort({ "metadata.cycleScanAt": 1, createdAt: -1 })
        .limit(limit - picked.size),
    );
  }

  // Hand the slots the renewal tiers did not need back to the freshest rows. `take` dedupes on _id,
  // so this only ever adds rows the budget above held back - which is what keeps the cap from
  // throttling a site that has plenty of capacity left.
  if (picked.size < limit) take(fresh);

  return [...picked.values()];
}

/**
 * Advance the round-robin cursor for a row this run has looked at.
 *
 * HAZARD - this MUST be written with `{ timestamps: false }`. The model sets `timestamps: true`, and
 * reconcileStalePendingSubscriptions in lib/billing/subscription-reconciliation.ts selects abandoned
 * checkouts with `{ status: "payment_pending", updatedAt: { $lte: cutoff } }` against a 2h cutoff.
 * Bumping updatedAt on every scan resets an abandoned checkout's age, so once this cron runs more
 * often than every 2h that row can NEVER reach the cutoff: never cancelled, permanently occupying
 * the one_live_subscription_per_user index slot, and the customer can then never start a new
 * subscription at all.
 */
async function stampScanned(subscriptionId: unknown) {
  await Subscription.updateOne(
    { _id: subscriptionId },
    { $set: { "metadata.cycleScanAt": new Date() } },
    { timestamps: false },
  ).catch((error) => {
    // A lost stamp only means the row is rescanned sooner than it needed to be, which is the safe
    // direction. It must never abort the run that is delivering someone's credits.
    console.error("[billing] could not advance the cycle scan cursor", {
      subscriptionId: String(subscriptionId),
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

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

    // Claim the coupon too. This recovery path had no coupon awareness at all -
    // redeemCoupon was only ever called by verify and the charged webhook - so a
    // subscription rescued here kept a merely RESERVED redemption, which the
    // orphan sweep then released two hours later even though the money had
    // moved. The allowance went back to the customer and the code became
    // repeatable. `claimRedemptionForSettledPurchase` accepts a released row for
    // the same reason: the sweep may already have won the race.
    await claimRedemptionForSettledPurchase(providerSubscriptionId).catch((error) => {
      console.error("[billing] could not claim the coupon for a settled purchase", {
        providerSubscriptionId,
        error: error instanceof Error ? error.message : String(error),
      });
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

  const subscriptions = await selectSubscriptionsToScan(limit);

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
    } finally {
      // Advance the cursor whether or not the scan found anything. A clean scan writes nothing else
      // to this document, and that is exactly how the old oldest-updatedAt ordering rescanned the
      // same fifty rows every night and never reached a newer one.
      await stampScanned(subscription._id);
    }
  }

  return summary;
}
