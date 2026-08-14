import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import UserBilling from "../models/userBilling";

/**
 * One-time repair for pricing locks written by the removed US/tier_1/USD fallback.
 *
 * Before the regional-pricing fix, any authenticated request that arrived without a trusted geo
 * header resolved to a hardcoded US / tier_1 / USD context, and resolveUserPricingContext persisted
 * that as the customer's permanent lock on their first authenticated hit. The tier ratchet only ever
 * moves upward and tier_1 is the top rank, so shouldUpgrade can never fire - those customers stay
 * quoted USD tier_1 forever even once their real country is detected correctly.
 *
 * Clearing a lock is safe for everyone: the next request re-derives it from a real trusted
 * observation, so a genuine US customer re-locks to US/tier_1/USD and an Indian customer re-locks to
 * IN/tier_3/INR. Nothing is charged or refunded here - only the quoting basis is reset.
 *
 * Scope is deliberately narrow: only locks that could have come from the removed fallback, i.e.
 * US + tier_1 + reason "initial_detection". Locks earned via a real higher-tier detection
 * (reason "higher_tier_detection") are left untouched.
 *
 * Usage:
 *   npx tsx scripts/migrate-reset-default-pricing-locks.ts --dry-run
 *   npx tsx scripts/migrate-reset-default-pricing-locks.ts
 */

const DRY_RUN = process.argv.includes("--dry-run");
/**
 * Also reset locks written by the upward tier ratchet ("higher_tier_detection").
 *
 * Before corroboration was required, a single request from a VPN, hotel Wi-Fi, or mis-geolocated
 * mobile IP was enough to promote a customer to tier_1 permanently - the ratchet only moves upward,
 * so returning to their real country never repairs it. Use this to unwind those. Re-derivation is
 * still safe: a customer genuinely in a tier_1 country simply re-locks there.
 */
const INCLUDE_UPGRADES = process.argv.includes("--include-upgrades");

const SUSPECT_LOCK_FILTER = INCLUDE_UPGRADES
  ? {
      pricingTier: "tier_1",
      pricingLockReason: { $in: ["initial_detection", "higher_tier_detection"] },
    }
  : {
      pricingCountry: "US",
      pricingTier: "tier_1",
      pricingLockReason: "initial_detection",
    };

async function migrate() {
  await dbConnect();

  const affected = await UserBilling.find(SUSPECT_LOCK_FILTER)
    .select("user pricingCountry pricingTier pricingCurrency pricingLockedAt pricingLockReason")
    .lean();

  if (affected.length === 0) {
    console.log("No default-derived pricing locks found. Nothing to do.");
    return;
  }

  console.log(`Found ${affected.length} wallet(s) locked to US/tier_1 by initial detection:`);
  for (const wallet of affected) {
    console.log(
      `  user=${String(wallet.user)} ${wallet.pricingCountry}/${wallet.pricingTier}/${wallet.pricingCurrency} lockedAt=${wallet.pricingLockedAt?.toISOString?.() ?? "n/a"}`,
    );
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: no changes written. Re-run without the flag to apply.");
    return;
  }

  const result = await UserBilling.updateMany(SUSPECT_LOCK_FILTER, {
    $unset: {
      pricingCountry: "",
      pricingTier: "",
      pricingCurrency: "",
      pricingLockedAt: "",
      pricingLockReason: "",
      pricingUpgradeCandidateCountry: "",
      pricingUpgradeCandidateSeenAt: "",
    },
  });

  console.log(
    `\nCleared ${result.modifiedCount} pricing lock(s). Each will be re-derived from a trusted geo observation on the customer's next authenticated request.`,
  );
}

migrate()
  .catch((error) => {
    console.error("Pricing lock reset migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
