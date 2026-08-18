import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import UsageReservation from "../models/usageReservation";

const COMPOUND_INDEX_NAME = "user_1_idempotencyKey_1";

async function migrate() {
  await dbConnect();
  const collection = UsageReservation.collection;
  const indexes = await collection.indexes();

  if (!indexes.some((index) => index.name === COMPOUND_INDEX_NAME)) {
    await collection.createIndex(
      { user: 1, idempotencyKey: 1 },
      { unique: true, name: COMPOUND_INDEX_NAME },
    );
    console.log(`Created ${COMPOUND_INDEX_NAME}.`);
  }

  const obsoleteIndex = indexes.find((index) => {
    const keys = Object.keys(index.key || {});
    return keys.length === 1 && keys[0] === "idempotencyKey";
  });
  if (obsoleteIndex?.name) {
    await collection.dropIndex(obsoleteIndex.name);
    console.log(`Removed obsolete ${obsoleteIndex.name}.`);
  }

  console.log("Usage reservation idempotency index migration complete.");
}

migrate()
  .catch((error) => {
    console.error("Usage reservation index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
