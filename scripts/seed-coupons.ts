import "./load-env";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Coupon from "../models/coupon";
import { seedThresholdFor } from "../lib/billing/coupon";

/**
 * The four codes surfaced by the in-plugin credit-threshold modals.
 *
 * Monthly plans only. "15% off your first month" applied to sub_year_7499 is
 * 15% off a whole year — a materially different offer from the one the modal
 * describes, and not one anybody decided to make. Restricting the products is
 * the safer half of the choice the spec leaves open; changing the yearly copy
 * would be the other.
 *
 * `active` is deliberately false for every code. Seeding creates them;
 * enabling them is a separate, deliberate act — the rollout enables ONE first
 * and verifies a real discounted subscription reaches `captured` before the
 * rest, because no purchase in production has ever reached that state.
 *
 * READ-ONLY BY DEFAULT:
 *   npm run seed:coupons
 *   npm run seed:coupons -- --apply
 */
const APPLY = process.argv.includes("--apply");

const MONTHLY_PLANS = ["sub_month_1", "sub_month_2", "sub_month_3"];

const COUPONS = [
  {
    code: "WELCOME15",
    percent: 15,
    description: "Shown at a healthy balance — upgrade prompt",
    // Capped, unlike the others. It is the only code with no balance
    // requirement, so it is the only one an arbitrary account can take, and it
    // is the placeholder printed on the billing page. Uncapped, the seed run
    // itself would be the decision to give an unbounded number of people 15%
    // off. Raise it deliberately once the first real sale has been verified.
    maxRedemptions: 100,
  },
  {
    code: "BOOST20",
    percent: 20,
    description: "Shown at 50 credits — running low",
    maxRedemptions: null,
  },
  {
    code: "TOPUP25",
    percent: 25,
    description: "Shown at 25 credits — critical",
    maxRedemptions: null,
  },
  {
    code: "UNLOCK30",
    percent: 30,
    description: "Shown at 0 credits — exhausted",
    maxRedemptions: null,
  },
];

async function main() {
  await dbConnect();

  // Only seed plans that actually exist, so a rename does not silently create a
  // code that applies to nothing and fails at checkout with no explanation.
  const { getCatalogProduct } = await import("../lib/billing/catalog");
  const applicable = MONTHLY_PLANS.filter((code) => {
    const product = getCatalogProduct(code);
    return Boolean(product && product.kind === "subscription");
  });

  const missing = MONTHLY_PLANS.filter((code) => !applicable.includes(code));
  if (missing.length) {
    console.warn(`Skipping product codes not in the catalog: ${missing.join(", ")}`);
  }
  if (!applicable.length) {
    throw new Error("No monthly subscription products found in the catalog; refusing to seed.");
  }

  console.log(`Applies to: ${applicable.join(", ")}\n`);

  for (const definition of COUPONS) {
    const existing = await Coupon.findOne({ code: definition.code });
    const state = existing
      ? `exists (${existing.percent}%, ${existing.active ? "ACTIVE" : "inactive"})`
      : "will be created";
    console.log(
      `  ${definition.code.padEnd(10)} ${String(definition.percent).padStart(2)}%  ${state}`,
    );

    if (!APPLY) continue;

    // Never flips `active`. An operator who enabled a code must not have it
    // silently switched off by a re-run, and a code must never be switched on
    // by one either.
    // Only ever creates. An operator who set a global cap, narrowed the
    // products, or enabled a code must not have that silently reset by someone
    // re-running the seed - maxRedemptions in particular would go from "500
    // left" back to unlimited with no trace.
    if (existing) {
      console.log(`    (left untouched - edit it deliberately, not by re-seeding)`);
      continue;
    }
    // The balance ceiling is seeded onto the document, so it can be changed
    // later without a deploy. Infinity is not representable in BSON, so "no
    // balance requirement" is stored as null.
    const threshold = seedThresholdFor(definition.code);
    await Coupon.create({
      code: definition.code,
      percent: definition.percent,
      appliesToProductCodes: applicable,
      maxRedemptions: definition.maxRedemptions,
      maxPerUser: 1,
      maxCredits: Number.isFinite(threshold) ? threshold : null,
      description: definition.description,
      active: false,
    });
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write them (all inactive).");
    return;
  }
  console.log("\nSeeded. Every code is INACTIVE — enable one deliberately, verify a real");
  console.log("discounted subscription reaches captured, then enable the rest.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Coupon seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
