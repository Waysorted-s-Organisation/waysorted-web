import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import UserBilling from "../models/userBilling";
import CreditLedger from "../models/creditLedger";

/**
 * Backfill the missing opening-balance ledger rows that make wallets drift from the ledger.
 *
 * Legacy users were migrated from `user.creditsRemaining` straight into `UserBilling.availableCredits`
 * without a matching CreditLedger entry, and a few wallets were topped up by hand directly in the
 * database. The result is wallets whose balance is HIGHER than the sum of their ledger rows.
 *
 * Nobody is short-changed by this - every observed drift is in the customer's favour - but it makes
 * the ledger an incomplete audit trail, and it permanently pollutes inspectCreditLedgerConsistency:
 * the drift alarm reports the same accounts forever, so a genuine new drift would hide among them.
 *
 * This writes ONE reconciling ledger row per drifting wallet for exactly the difference, leaving
 * balances untouched. Only the audit trail changes.
 *
 * Usage:
 *   npm run migrate:backfill-wallet-seed-ledger -- --dry-run
 *   npm run migrate:backfill-wallet-seed-ledger
 */

const DRY_RUN = process.argv.includes("--dry-run");

async function migrate() {
  await dbConnect();

  const wallets = await UserBilling.find({})
    .select("user availableCredits heldCredits")
    .lean<Array<{ user: unknown; availableCredits?: number; heldCredits?: number }>>();

  const drifting: Array<{ user: string; wallet: number; ledger: number; delta: number }> = [];

  for (const wallet of wallets) {
    const [totals] = await CreditLedger.aggregate<{ total: number }>([
      { $match: { user: wallet.user } },
      { $group: { _id: null, total: { $sum: "$deltaCredits" } } },
    ]);
    const ledgerTotal = Number(totals?.total || 0);
    const walletTotal = Number(wallet.availableCredits || 0) + Number(wallet.heldCredits || 0);
    const delta = walletTotal - ledgerTotal;
    if (delta !== 0) {
      drifting.push({ user: String(wallet.user), wallet: walletTotal, ledger: ledgerTotal, delta });
    }
  }

  if (!drifting.length) {
    console.log(`Scanned ${wallets.length} wallets. No ledger drift. Nothing to do.`);
    return;
  }

  console.log(`Scanned ${wallets.length} wallets. ${drifting.length} drift from their ledger:\n`);
  for (const row of drifting) {
    console.log(
      `  user=${row.user} wallet=${row.wallet} ledger=${row.ledger} -> backfill ${row.delta > 0 ? "+" : ""}${row.delta}`,
    );
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: no changes written. Re-run without the flag to apply.");
    return;
  }

  let written = 0;
  let skipped = 0;
  for (const row of drifting) {
    // Deterministic key: re-running can never double-write, and the unique index enforces it.
    const idempotencyKey = `wallet-opening-balance:${row.user}`;
    try {
      await CreditLedger.create({
        user: row.user,
        deltaCredits: row.delta,
        // The wallet is authoritative here; this row exists to explain how it got there.
        balanceAfter: row.wallet,
        reason: "manual_adjustment",
        idempotencyKey,
        metadata: {
          source: "wallet_seed_backfill",
          reason:
            "Opening balance carried over from user.creditsRemaining or a manual adjustment, recorded retrospectively so the ledger reconciles with the wallet.",
          walletTotalAtBackfill: row.wallet,
          ledgerTotalAtBackfill: row.ledger,
        },
      });
      written += 1;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  console.log(`\nWrote ${written} reconciling ledger row(s); ${skipped} already present.`);
  console.log("Wallet balances were not modified.");
}

migrate()
  .catch((error) => {
    console.error("Wallet seed ledger backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
