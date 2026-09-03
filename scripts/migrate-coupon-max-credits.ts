import "./load-env";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Coupon from "../models/coupon";
import { seedThresholdFor } from "../lib/billing/coupon";

/**
 * Writes each live coupon's balance ceiling onto its own document.
 *
 * The ceiling used to live only in `COUPON_MAX_CREDITS` in source, which meant
 * the one number deciding who is offered which code could not be changed
 * without a deploy. It is a field on the coupon now, and `creditThresholdFor`
 * reads it - falling back to the old map for any row written before the field
 * existed, so behaviour is unchanged until this runs.
 *
 * This is that backfill. It is safe to run repeatedly and never touches a
 * coupon that already carries a value, because an operator who has tuned a
 * ceiling must not have it reset by a re-run.
 *
 *   npm run migrate:coupon-max-credits            dry run
 *   npm run migrate:coupon-max-credits -- --apply
 */
const APPLY = process.argv.includes("--apply");

async function main() {
  await dbConnect();

  // `.lean()` so the raw stored document is read. A hydrated document applies
  // schema defaults, which would make an unwritten field indistinguishable from
  // a deliberately-set one.
  const coupons = await Coupon.find({})
    .sort({ code: 1 })
    .lean<{ _id: unknown; code: string; maxCredits?: number | null }[]>();
  if (!coupons.length) {
    console.log("No coupons in the database. Run `npm run seed:coupons -- --apply` first.");
    return;
  }

  let planned = 0;
  for (const coupon of coupons) {
    // `undefined` means the field was never written. `null` is a deliberate
    // "no balance requirement" and must be left alone.
    const alreadySet = coupon.maxCredits !== undefined;
    const threshold = seedThresholdFor(coupon.code);
    const target = Number.isFinite(threshold) ? threshold : null;

    const describe = (value: number | null | undefined) =>
      value === undefined ? "unset" : value === null ? "no limit" : `${value} credits`;

    if (alreadySet) {
      console.log(`  ${coupon.code.padEnd(10)} ${describe(coupon.maxCredits)}  (left untouched)`);
      continue;
    }

    planned += 1;
    console.log(`  ${coupon.code.padEnd(10)} unset -> ${describe(target)}`);
    if (APPLY) {
      await Coupon.updateOne({ _id: coupon._id }, { $set: { maxCredits: target } });
      console.log(`      applied: yes`);
    }
  }

  if (!planned) {
    console.log("\nEvery coupon already carries a ceiling. Nothing to do.");
    return;
  }
  if (!APPLY) {
    console.log(`\nDry run. ${planned} coupon(s) would change. Re-run with --apply to write.`);
    return;
  }
  console.log(`\nDone. ${planned} coupon(s) migrated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
