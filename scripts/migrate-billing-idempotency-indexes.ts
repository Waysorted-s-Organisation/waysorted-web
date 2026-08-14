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

async function createLiveSubscriptionIndex() {
  const duplicate = await Subscription.aggregate([
    { $match: { status: { $in: ["payment_pending", "active", "cancel_scheduled", "halted"] } } },
    { $group: { _id: "$user", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicate.length) {
    throw new Error(`User has multiple live subscriptions and requires reconciliation: ${duplicate[0]._id}`);
  }
  await Subscription.collection.createIndex(
    { user: 1 },
    {
      unique: true,
      partialFilterExpression: {
        status: { $in: ["payment_pending", "active", "cancel_scheduled", "halted"] },
      },
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
