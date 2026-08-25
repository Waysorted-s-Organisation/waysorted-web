import "./load-env";
import mongoose from "mongoose";
import Subscription from "../models/subscription";
import type { Types } from "mongoose";
import CreditLedger from "../models/creditLedger";
import { getCatalogProduct } from "../lib/billing/catalog";

/**
 * Suppresses the plan bonus for subscriptions that predate it.
 *
 * applySubscriptionCycleCredits grants a plan's bonus the first time it sees no
 * `subscription-plan-bonus:<user>:<planCode>` ledger row. That key did not exist
 * before the bonus shipped, so every subscription taken out earlier would collect
 * one on its next renewal - a welcome bonus for a plan the customer has already
 * been on for months, which is not what it is for.
 *
 * This writes the key for those subscriptions so the grant is skipped. The row is
 * a marker, not a grant: deltaCredits is 0, so it is invisible to the wallet, it
 * leaves ledger-reconciliation consistent (that sums deltaCredits against the
 * wallet balance), and it never reaches billing history, which lists only
 * `subscription-cycle:` rows.
 *
 * The predicate is NOT "a subscription row predates the cutoff". A row is written
 * at checkout START, before any money moves, and an abandoned or declined checkout
 * is later parked at `expired` or `cancelled` - so row existence proves nothing was
 * ever paid. Marking those would not restore intended state, it would invent a
 * denial: the customer returns, pays in full, and silently receives fewer credits
 * than the pricing card promised, with no path anywhere to reverse it.
 *
 * db.ts says the key exists so that resubscribing does not RE-issue the bonus.
 * Re-issue presupposes a first issue. So the predicate is: this (user, plan) has
 * already consumed a paid cycle that granted no bonus - i.e. a
 * `subscription_cycle_grant` for that plan, dated before the bonus went live.
 * Anything else is left alone and will be granted its bonus normally.
 *
 *   npm run backfill:plan-bonus            dry run
 *   npm run backfill:plan-bonus -- --apply
 */
const APPLY = process.argv.includes("--apply");

// Production deploy of the merge that shipped the bonus (PR #69).
const CUTOFF = new Date("2026-08-23T14:18:35Z");

async function main() {
  const mongoUri = process.env.MONGODB_URI_TOOLS || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Error: set MONGODB_URI_TOOLS or MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(mongoUri);

  const subs = await Subscription.find({})
    .select("user planCode status createdAt")
    .lean();

  /*
   * Some rows carry no createdAt. Falling through the cutoff check on those would
   * be the one unrecoverable mistake here - a subscription taken out AFTER the
   * bonus shipped is genuinely owed one, and a marker row would silently cancel
   * it. A Mongo ObjectId encodes the second it was generated, so the row's own id
   * dates it even when the field is absent.
   */
  const createdAtOf = (sub: { createdAt?: Date | null; _id: unknown }) =>
    sub.createdAt ?? new mongoose.Types.ObjectId(String(sub._id)).getTimestamp();

  console.log(`subscriptions in the database: ${subs.length}`);

  // One key per (user, plan) - a customer may hold several rows for the same plan.
  // Group every subscription row by (user, plan) so one key is decided per pair.
  const groups = new Map<string, { user: string; planCode: string; subIds: Types.ObjectId[]; statuses: string[] }>();
  let skippedNoBonus = 0;
  for (const sub of subs) {
    const product = getCatalogProduct(sub.planCode);
    if (!product || product.bonusCredits <= 0) { skippedNoBonus += 1; continue; }
    const key = `subscription-plan-bonus:${sub.user}:${sub.planCode}`;
    const g = groups.get(key) ?? { user: String(sub.user), planCode: sub.planCode, subIds: [], statuses: [] };
    g.subIds.push(sub._id as Types.ObjectId);
    g.statuses.push(String(sub.status));
    groups.set(key, g);
  }

  const candidates = new Map<string, { user: string; planCode: string; status: string; grantedAt: Date }>();
  let skippedNeverPaid = 0;
  let skippedPaidAfterCutoff = 0;

  for (const [key, g] of groups) {
    /*
     * The only evidence that counts: a cycle actually granted credits for this
     * plan. reason is pinned as well as the id list, because that reason is
     * written only by the three paths that represent a charged cycle.
     */
    const grant = await CreditLedger.findOne({
      user: g.user,
      reason: "subscription_cycle_grant",
      subscription: { $in: g.subIds },
    }).sort({ createdAt: 1 }).select("createdAt").lean();

    if (!grant) { skippedNeverPaid += 1; continue; }

    const grantedAt = grant.createdAt ? new Date(grant.createdAt) : createdAtOf(grant as never);
    // A cycle granted at or after the cutoff already ran under the bonus rules and
    // either took its bonus (key exists, skipped below) or is owed one.
    if (grantedAt >= CUTOFF) { skippedPaidAfterCutoff += 1; continue; }

    candidates.set(key, { user: g.user, planCode: g.planCode, status: g.statuses.join("/"), grantedAt });
  }

  console.log(`  skipped, plan carries no bonus:            ${skippedNoBonus}`);
  console.log(`  skipped, never had a paid cycle:           ${skippedNeverPaid}`);
  console.log(`  skipped, first paid cycle after the cutoff: ${skippedPaidAfterCutoff}`);
  console.log(`  (user, plan) with a bonus-free paid cycle: ${candidates.size}`);

  const pending: Array<[string, { user: string; planCode: string; status: string; grantedAt: Date }]> = [];
  for (const [key, info] of candidates) {
    const already = await CreditLedger.exists({ idempotencyKey: key });
    if (already) continue;
    pending.push([key, info]);
  }

  console.log(`  already have the key (no action):     ${candidates.size - pending.length}`);
  console.log(`\nWould write ${pending.length} marker row(s):`);
  for (const [key, info] of pending) {
    const product = getCatalogProduct(info.planCode);
    console.log(
      `  ${info.planCode.padEnd(14)} ${String(info.status).padEnd(16)} ` +
      `paid cycle ${info.grantedAt.toISOString().slice(0, 10)}  ` +
      `suppresses +${product?.bonusCredits} credits  ${key}`,
    );
  }

  if (!pending.length) {
    console.log("\nNothing to do.");
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log(`\nDry run. Re-run with --apply to write them.`);
    await mongoose.disconnect();
    return;
  }

  let written = 0;
  for (const [key, info] of pending) {
    const product = getCatalogProduct(info.planCode);
    try {
      await CreditLedger.create({
        user: info.user,
        deltaCredits: 0,
        balanceAfter: null,
        reason: "manual_adjustment",
        idempotencyKey: key,
        metadata: {
          backfill: "plan-bonus-suppression",
          planCode: info.planCode,
          suppressedBonusCredits: product?.bonusCredits ?? 0,
          reasonNote: "This plan already ran a paid cycle before the bonus existed, so the welcome moment has passed.",
          firstPaidCycleAt: info.grantedAt.toISOString(),
          cutoff: CUTOFF.toISOString(),
        },
      });
      written += 1;
    } catch (error) {
      // A concurrent renewal may have written the real grant between the read and
      // this insert. The unique index makes that a duplicate key, and it means the
      // customer already has the row, so there is nothing left to suppress.
      if ((error as { code?: number }).code === 11000) continue;
      throw error;
    }
  }
  console.log(`\nWrote ${written} marker row(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
