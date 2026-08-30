import "./load-env";
import mongoose, { Types } from "mongoose";
import dbConnect from "../lib/db";
import Coupon from "../models/coupon";
import CouponRedemption from "../models/couponRedemption";
import { normalizeCouponCode } from "../lib/billing/coupon-code";
import { getCatalogProduct } from "../lib/billing/catalog";
import { purgeUrls, couponPurgePaths } from "../lib/cloudflare-purge";

/**
 * Turns a seeded coupon on, or back off.
 *
 * scripts/seed-coupons.ts creates every code with `active: false` and
 * deliberately never flips it, so that re-seeding cannot silently re-enable a
 * code an operator disabled. Nothing else in the repo ever wrote that flag:
 * `Coupon.create` in the seed was the only write to the collection, so a seeded
 * code could be created but never enabled. Every discount was rejected with
 * `coupon_inactive` at lib/billing/coupon-discount.ts:43, which made the whole
 * coupon feature dead on arrival - the in-plugin credit-threshold modals
 * offered four codes that could not be redeemed by anyone. This is the missing
 * half of the seed.
 *
 * It only ever flips `active` on a code that already exists. Creating one is
 * seed-coupons' job, and a typo here must not mint a live discount nobody
 * reviewed.
 *
 * READ-ONLY BY DEFAULT:
 *   npm run coupon:activate -- BOOST20
 *   npm run coupon:activate -- BOOST20 --apply
 *   npm run coupon:activate -- BOOST20 --off --apply
 *   npm run coupon:activate -- --all
 *   npm run coupon:activate -- --all --off --apply
 */

/** A bad flag or a bad code, reported without a stack trace. */
class UsageError extends Error {}

const KNOWN_FLAGS = new Set(["--apply", "--on", "--off", "--all"]);

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes("--apply");
const ALL = ARGS.includes("--all");
const OFF = ARGS.includes("--off");
const ON = ARGS.includes("--on");

const USAGE = [
  "Usage: npm run coupon:activate -- <CODE...|--all> [--off] [--apply]",
  "  --apply   write the change (omit for a dry run)",
  "  --off     disable instead of enable",
  "  --all     every coupon in the database (reports on any state, writes only with --off)",
].join("\n");

/**
 * The shape the report needs. Named rather than inferred so `.lean()` does not
 * hand back a Document whose `active` can be reassigned - nothing here should
 * be able to write through a row it only read.
 *
 * Every field the schema defaults is optional here, because `.lean<T>()` is an
 * unchecked assertion: it describes what the schema WRITES, not what the
 * collection holds. A row inserted or `$unset` by hand in a shell still has to
 * survive this loop, since crashing partway through leaves earlier codes
 * flipped and the run half-applied.
 */
type CouponRow = {
  _id: Types.ObjectId;
  code: string;
  percent: number;
  active?: boolean;
  appliesToProductCodes?: string[];
  maxRedemptions?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
};

function label(active: boolean | undefined): string {
  return active ? "ACTIVE" : "inactive";
}

/**
 * Parses argv into the set of codes and the state they should end in.
 *
 * Unrecognised flags are refused rather than ignored. `--apply` alongside a
 * mistyped `--off` would otherwise read as a plain enable and turn a code ON
 * for real customers while the operator believed they were switching it off.
 */
function parseArgs(): { codes: string[]; target: boolean } {
  const unknown = ARGS.filter((arg) => arg.startsWith("-") && !KNOWN_FLAGS.has(arg));
  if (unknown.length) {
    throw new UsageError(`Unrecognised flag(s): ${unknown.join(", ")}\n${USAGE}`);
  }

  if (ON && OFF) {
    throw new UsageError(`--on and --off are contradictory.\n${USAGE}`);
  }

  // Anything with a leading dash was flag-checked above, so what is left is
  // positional. A stray "-off" can never reach normalizeCouponCode and be
  // mistaken for a code.
  const positional = ARGS.filter((arg) => !arg.startsWith("-"));

  if (ALL && positional.length) {
    throw new UsageError(
      `--all takes no codes, but got: ${positional.join(", ")}\n` +
        "Name the codes or pass --all, not both.",
    );
  }
  if (!ALL && !positional.length) {
    throw new UsageError(`No coupon code given.\n${USAGE}`);
  }

  // --all may report on anything, but it may never turn a code ON.
  //
  // It is not its own inverse: after `--all --off` the codes that were already
  // disabled are indistinguishable from the ones that were live, so reversing
  // an incident with `--all --apply` enables codes nobody ever enabled -
  // WELCOME15 among them, the one code with no balance requirement that any
  // account can take. It also contradicts the staged rollout the seed script
  // exists to enforce: enable ONE, verify a real discounted subscription
  // reaches captured, then the rest. Naming the codes keeps the direction that
  // costs money deliberate, and puts the per-code warnings below in front of
  // the operator who has to read them.
  if (ALL && !OFF && APPLY) {
    throw new UsageError(
      "--all --apply would enable every coupon in the database at once.\n" +
        "Name the codes to enable them. --all only writes with --off.",
    );
  }

  const invalid: string[] = [];
  const codes: string[] = [];
  for (const arg of positional) {
    const normalized = normalizeCouponCode(arg);
    if (!normalized) {
      invalid.push(arg);
      continue;
    }
    if (!codes.includes(normalized)) codes.push(normalized);
  }
  if (invalid.length) {
    throw new UsageError(`Not a valid coupon code: ${invalid.join(", ")}`);
  }

  return { codes, target: !OFF };
}

/** Live claims, counted exactly as the redemption cap counts them. */
async function countRedemptions(couponId: Types.ObjectId) {
  const [total, live] = await Promise.all([
    CouponRedemption.countDocuments({ coupon: couponId }),
    // Matches lib/billing/coupon.ts:86 - a released row returns supply to the
    // pool, so it is not what the cap is measured against.
    CouponRedemption.countDocuments({
      coupon: couponId,
      status: { $in: ["reserved", "redeemed"] },
    }),
  ]);
  return { total, live, released: total - live };
}

/**
 * Why a code will still be refused after this run enables it.
 *
 * `active` is only the first of the gates in checkCouponEligibility. Enabling a
 * code whose product list is empty or whose window has closed changes a flag
 * and nothing else, and the operator would have no reason to suspect it until a
 * customer reported the discount failing.
 */
function inertReasons(row: CouponRow, redeemed: number, now: Date): string[] {
  const reasons: string[] = [];
  const products = row.appliesToProductCodes ?? [];
  if (!products.length) {
    reasons.push("appliesToProductCodes is empty - an empty list means NO product, not all");
  }

  // A product code that has since left the catalog is exactly as dead as an
  // empty list. Both callers of resolveCoupon pass a code that came out of
  // getCatalogProduct, so checkCouponEligibility's `includes(productCode)` can
  // never match one. seed-coupons checks the catalog when it CREATES a code and
  // nothing re-checks it afterwards, so a rename between seeding and enabling
  // would otherwise report a clean success on a code that cannot be redeemed.
  const unknownProducts = products.filter((code) => !getCatalogProduct(code));
  if (unknownProducts.length) {
    reasons.push(`no longer in the catalog, so no checkout can match: ${unknownProducts.join(", ")}`);
  }

  if (row.validFrom && now < row.validFrom) {
    reasons.push(`does not start until ${row.validFrom.toISOString()}`);
  }
  if (row.validUntil && now > row.validUntil) {
    reasons.push(`expired on ${row.validUntil.toISOString()}`);
  }
  // Matches lib/billing/coupon.ts:84, which treats null and undefined alike -
  // an absent field is uncapped, not a cap of zero.
  if (typeof row.maxRedemptions === "number" && redeemed >= row.maxRedemptions) {
    reasons.push(`cap already reached (${redeemed}/${row.maxRedemptions})`);
  }
  return reasons;
}

async function main() {
  const { codes, target } = parseArgs();

  await dbConnect();

  let rows: CouponRow[];
  if (ALL) {
    rows = await Coupon.find({}).sort({ code: 1 }).lean<CouponRow[]>();
    if (!rows.length) {
      throw new UsageError("No coupons in the database. Run `npm run seed:coupons -- --apply` first.");
    }
  } else {
    const found = await Coupon.find({ code: { $in: codes } })
      .sort({ code: 1 })
      .lean<CouponRow[]>();

    // Every code is checked before anything is written. A typo in one of four
    // codes must not leave the other three flipped and the run half-applied.
    const missing = codes.filter((code) => !found.some((row) => row.code === code));
    if (missing.length) {
      throw new UsageError(
        `Not in the database: ${missing.join(", ")}\n` +
          "Refusing to create it - use `npm run seed:coupons` to add a coupon.",
      );
    }
    rows = found;
  }

  const now = new Date();
  console.log(`Target state: ${label(target)}\n`);

  let changed = 0;
  for (const row of rows) {
    const redemptions = await countRedemptions(row._id);
    const willChange = row.active !== target;

    console.log(
      `  ${row.code.padEnd(10)} ${String(row.percent).padStart(2)}%  ` +
        `${label(row.active)} -> ${label(target)}${willChange ? "" : "  (no change)"}`,
    );
    console.log(
      `      redemptions: ${redemptions.total} total ` +
        `(${redemptions.live} live, ${redemptions.released} released)`,
    );
    console.log(`      applies to: ${row.appliesToProductCodes?.join(", ") || "(none)"}`);

    if (target && redemptions.live > 0) {
      console.log(
        `      NOTE: ${redemptions.live} live redemption(s) already exist for this code.`,
      );
    }
    if (target) {
      for (const reason of inertReasons(row, redemptions.live, now)) {
        console.log(`      WARNING: still refused - ${reason}`);
      }
    }

    if (!willChange) continue;
    changed += 1;
    if (!APPLY) continue;

    // Conditional on the state that was just read, so a concurrent flip wins
    // rather than being silently overwritten by a stale value.
    //
    // Expressed as $ne rather than `active: row.active`, because mongoose
    // strips undefined keys out of a filter: on a row with no `active` field
    // the compare-and-swap silently degraded to an unconditional write, which
    // is the one case this guard exists for. $ne also matches an absent field,
    // so that row is still flipped.
    const result = await Coupon.updateOne(
      { _id: row._id, active: { $ne: target } },
      { $set: { active: target } },
    );
    console.log(
      `      applied: ${result.modifiedCount === 1 ? "yes" : "no (changed concurrently)"}`,
    );
    if (result.modifiedCount !== 1) {
      throw new Error(
        `${row.code} changed underneath this run. Re-run to see its current state.`,
      );
    }
  }

  if (!APPLY) {
    const next =
      ALL && !OFF
        ? "Name the codes and re-run with --apply to write - --all cannot enable."
        : "Re-run with --apply to write.";
    console.log(`\nDry run. ${changed} code(s) would change. ${next}`);
    return;
  }
  console.log(`\nDone. ${changed} code(s) set to ${label(target)}.`);

  /*
   * The Header reads the public ladder on every marketing page view, so a coupon
   * that is live in Mongo is still invisible until Cloudflare's copy is dropped.
   * Only on a real write - a dry run must not touch the edge.
   */
  if (changed) {
    await purgeUrls(couponPurgePaths(), "coupon:set-active");
  }
  if (target && changed) {
    console.log("Verify a real discounted subscription reaches captured before enabling more.");
  }
}

// No process.exit(0) on success, unlike the neighbouring scripts: exiting from
// the `then` skips the `finally` below, and a non-zero code set in `catch` has
// to survive to the real exit for CI and for an operator's `&&`.
main()
  .catch((error) => {
    if (error instanceof UsageError) {
      console.error(error.message);
    } else {
      console.error("Coupon activation failed:", error);
    }
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
