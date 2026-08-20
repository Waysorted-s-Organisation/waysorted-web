import "./load-env";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Purchase from "../models/purchase";
import Subscription from "../models/subscription";
import CreditLedger from "../models/creditLedger";

/**
 * Settles subscription purchases whose payment was taken but never recorded.
 *
 * Zero purchases in this product's history have ever reached "captured", and
 * none carry a razorpayPaymentId — yet subscriptions are live and credits have
 * been granted. The cause was a gap, now closed in
 * lib/billing/subscription-cycle-reconciliation.ts: nothing settled a
 * subscription purchase when its webhook failed to arrive.
 * purchase-reconciliation.ts:28 excludes kind "subscription" by design, and
 * subscription-reconciliation only ever marks these FAILED, on expiry.
 *
 * This repairs the rows that were stranded before that fix existed.
 *
 * CREDIT-NEUTRAL BY CONSTRUCTION. It never touches a wallet and never writes a
 * ledger entry. It sets grantApplied: true precisely so that applyPurchaseCredits
 * — which gates on `grantApplied: false` (lib/billing/db.ts:657-673) — can never
 * fire for the repaired row afterwards. Leaving that flag false while marking
 * the purchase captured is the one change that WOULD grant credits again.
 *
 * The payment id comes from the credit ledger, which recorded it at grant time,
 * so no provider call and no guesswork is involved.
 *
 * READ-ONLY BY DEFAULT:
 *   npm run repair:subscription-purchases
 *   npm run repair:subscription-purchases -- --apply
 */
const APPLY = process.argv.includes("--apply");

async function main() {
  await dbConnect();

  const unsettled = await Purchase.find({
    kind: "subscription",
    status: { $in: ["pending", "created"] },
    razorpaySubscriptionId: { $ne: null },
  }).lean();

  if (!unsettled.length) {
    console.log("No unsettled subscription purchases.");
    return;
  }

  console.log(`Unsettled subscription purchases: ${unsettled.length}\n`);
  let repairable = 0;

  for (const purchase of unsettled) {
    const subscription = await Subscription.findOne({
      providerSubscriptionId: purchase.razorpaySubscriptionId,
    }).lean();

    // Only settle a purchase whose subscription is actually live. A pending row
    // against an expired or cancelled subscription is a genuinely abandoned
    // checkout and must stay unsettled.
    const live =
      subscription &&
      ["active", "cancel_scheduled", "scheduled"].includes(String(subscription.status));

    // The payment id, from the ledger row the grant already wrote.
    const grant = await CreditLedger.findOne({
      user: purchase.user,
      reason: "subscription_cycle_grant",
      "metadata.paymentId": { $exists: true, $ne: null },
      idempotencyKey: { $regex: purchase.razorpaySubscriptionId },
    })
      .sort({ createdAt: 1 })
      .lean();

    const paymentId =
      (grant?.metadata as { paymentId?: string } | undefined)?.paymentId || null;

    const status = !live
      ? "SKIP - subscription is not live"
      : !paymentId
        ? "SKIP - no recorded payment id"
        : "REPAIR";

    console.log(
      `  ${String(purchase._id)}  ${purchase.productCode}  ` +
        `${purchase.amountPaise} ${purchase.currency}  ${status}`,
    );
    if (status !== "REPAIR") continue;
    repairable += 1;
    console.log(`      -> captured, paymentId ${paymentId}, grantApplied true (no credits touched)`);

    if (!APPLY) continue;

    // Conditional on still being unsettled: if a webhook lands between the read
    // and the write, the webhook's version wins rather than being overwritten.
    const result = await Purchase.updateOne(
      { _id: purchase._id, status: { $in: ["pending", "created"] } },
      {
        $set: {
          status: "captured",
          capturedAt: grant?.createdAt || new Date(),
          razorpayPaymentId: paymentId,
          grantApplied: true,
          "notes.repairedBy": "repair-unsettled-subscription-purchases",
          "notes.repairedAt": new Date().toISOString(),
          "notes.repairReason":
            "payment taken at provider, webhook never delivered; credits already granted separately",
        },
      },
    );
    console.log(`      applied: ${result.modifiedCount === 1 ? "yes" : "no (changed concurrently)"}`);
  }

  if (!APPLY) {
    console.log(`\nDry run. ${repairable} row(s) would be repaired. Re-run with --apply.`);
    console.log("No wallet and no ledger entry is written by this script, in either mode.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Repair failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
