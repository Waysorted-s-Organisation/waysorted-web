import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Purchase from "../models/purchase";
import Refund from "../models/refund";
import Subscription from "../models/subscription";

async function replacePurchaseIndex() {
  const indexes = await Purchase.collection.indexes();
  const obsolete = indexes.find((index) => {
    const keys = Object.keys(index.key || {});
    return keys.length === 1 && keys[0] === "idempotencyKey";
  });
  if (obsolete?.name) await Purchase.collection.dropIndex(obsolete.name);
  await Purchase.collection.createIndex(
    { user: 1, idempotencyKey: 1 },
    { unique: true, name: "user_1_idempotencyKey_1" },
  );
}

/**
 * Drop an existing index whose options differ from what we are about to create.
 *
 * MongoDB rejects createIndex with IndexOptionsConflict when an index of the same name exists with
 * different options - so a collection carrying a non-unique version of one of these guards would
 * make the whole migration abort before reaching the later steps, silently leaving them unapplied.
 */
async function dropIfOptionsDiffer(
  collection: { indexes: () => Promise<Record<string, unknown>[]>; dropIndex: (n: string) => Promise<unknown> },
  name: string,
  want: {
    unique?: boolean;
    sparse?: boolean;
    partial?: boolean;
    /** Exact partial filter required. Compared by VALUE, not merely by presence. */
    partialFilterExpression?: Record<string, unknown>;
  },
) {
  const existing = (await collection.indexes()).find((index) => index.name === name);
  if (!existing) return false;

  // Compare the partial filter's CONTENT, not just whether one exists. A filter whose value changed
  // - for instance adding a new live subscription status - leaves an index that still enforces the
  // OLD predicate. MongoDB would not complain, createIndex would be a silent no-op, and the
  // invariant the index is supposed to guarantee would quietly stop covering the new status.
  const filterMatches = want.partialFilterExpression
    ? JSON.stringify(existing.partialFilterExpression ?? null) ===
      JSON.stringify(want.partialFilterExpression)
    : Boolean(existing.partialFilterExpression) === Boolean(want.partial);

  const matches =
    Boolean(existing.unique) === Boolean(want.unique) &&
    Boolean(existing.sparse) === Boolean(want.sparse) &&
    filterMatches;
  if (matches) return false;
  await collection.dropIndex(name);
  console.log(`Dropped ${name} (options differed from required definition).`);
  return true;
}

async function createRefundIndex() {
  const duplicates = await Refund.aggregate([
    { $match: { providerRefundId: { $type: "string", $ne: "" } } },
    { $group: { _id: "$providerRefundId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicates.length) {
    throw new Error(
      `Duplicate provider refund ID requires manual reconciliation: ${duplicates[0]._id}`,
    );
  }
  await dropIfOptionsDiffer(Refund.collection, "providerRefundId_1", {
    unique: true,
    sparse: true,
  });
  await Refund.collection.createIndex(
    { providerRefundId: 1 },
    { unique: true, sparse: true, name: "providerRefundId_1" },
  );
}

async function createUniquePurchaseProviderIndexes() {
  for (const field of ["razorpayOrderId", "razorpayPaymentId"] as const) {
    const duplicates = await Purchase.aggregate([
      { $match: { [field]: { $type: "string", $ne: "" } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 1 },
    ]);
    if (duplicates.length) {
      throw new Error(`Duplicate ${field} requires manual reconciliation: ${duplicates[0]._id}`);
    }
    const legacyIndex = (await Purchase.collection.indexes()).find(
      (index) => index.name === `${field}_1`,
    );
    if (legacyIndex?.name) await Purchase.collection.dropIndex(legacyIndex.name);
    await dropIfOptionsDiffer(Purchase.collection, `${field}_unique`, {
      unique: true,
      partial: true,
    });
    await Purchase.collection.createIndex(
      { [field]: 1 },
      {
        unique: true,
        partialFilterExpression: { [field]: { $type: "string" } },
        name: `${field}_unique`,
      },
    );
  }
}

const LIVE_SUBSCRIPTION_STATUSES = [
  "payment_pending",
  "scheduled",
  "active",
  "cancel_scheduled",
  "halted",
];

async function createLiveSubscriptionIndex() {
  const duplicate = await Subscription.aggregate([
    { $match: { status: { $in: LIVE_SUBSCRIPTION_STATUSES } } },
    { $group: { _id: "$user", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicate.length) {
    throw new Error(`User has multiple live subscriptions and requires reconciliation: ${duplicate[0]._id}`);
  }
  await dropIfOptionsDiffer(Subscription.collection, "one_live_subscription_per_user", {
    unique: true,
    partialFilterExpression: { status: { $in: LIVE_SUBSCRIPTION_STATUSES } },
  });
  await Subscription.collection.createIndex(
    { user: 1 },
    {
      unique: true,
      partialFilterExpression: { status: { $in: LIVE_SUBSCRIPTION_STATUSES } },
      name: "one_live_subscription_per_user",
    },
  );
}

async function migrate() {
  await dbConnect();
  await replacePurchaseIndex();
  await createRefundIndex();
  await createUniquePurchaseProviderIndexes();
  await createLiveSubscriptionIndex();
  console.log("Billing idempotency index migration complete.");
}

migrate()
  .catch((error) => {
    console.error("Billing idempotency index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
