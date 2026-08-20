import "./load-env";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Purchase from "../models/purchase";

/**
 * Clears `razorpayOrderId: ""` from purchase rows.
 *
 * A subscription payment carries no order id, and the webhook's
 * `matchedPurchase.razorpayOrderId ||= orderId` assigned the empty string that
 * `String(payment.order_id || order.id || "")` produces. The partial unique
 * index on razorpayOrderId covers `{$type: "string"}`, and "" satisfies it - so
 * the first subscription to settle claimed the "" slot and every subsequent one
 * failed the index with E11000, threw out of the webhook, and was retried by
 * Razorpay without ever settling.
 *
 * The write is fixed, but a row that already took "" keeps occupying the slot
 * and keeps poisoning new customers. This releases it. Purchases are matched by
 * subscription id, so a null order id loses nothing - and the rest of the
 * codebase already treats "" as absent (purchase-reconciliation excludes it,
 * the index migration excludes it).
 *
 *   npm run repair:empty-order-ids
 *   npm run repair:empty-order-ids -- --apply
 */
const APPLY = process.argv.includes("--apply");

async function main() {
  await dbConnect();

  const affected = await Purchase.find({ razorpayOrderId: "" })
    .select("_id kind status razorpaySubscriptionId createdAt")
    .lean<{ _id: unknown; kind: string; status: string; razorpaySubscriptionId?: string | null; createdAt?: Date }[]>();

  if (!affected.length) {
    console.log("No purchase rows carry an empty razorpayOrderId. Nothing to repair.");
    return;
  }

  console.log(`${affected.length} row(s) hold the poisoned "" slot:\n`);
  for (const row of affected) {
    console.log(
      `  ${String(row._id)}  ${row.kind}/${row.status}  sub=${row.razorpaySubscriptionId || "none"}  ${row.createdAt?.toISOString() || ""}`,
    );
  }

  if (!APPLY) {
    console.log(`\nDry run. Re-run with --apply to set them to null.`);
    return;
  }

  const result = await Purchase.updateMany(
    { razorpayOrderId: "" },
    { $set: { razorpayOrderId: null } },
  );
  console.log(`\nDone. ${result.modifiedCount} row(s) released the unique slot.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
