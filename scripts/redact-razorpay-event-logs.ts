import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import { sanitizeRazorpayWebhookPayload } from "../lib/billing/webhook-processing";
import RazorpayEventLog from "../models/razorpayEventLog";

async function redact() {
  await dbConnect();
  const cursor = RazorpayEventLog.find({}).cursor();
  let updated = 0;
  for await (const event of cursor) {
    event.signature = null;
    event.payload = sanitizeRazorpayWebhookPayload(event.payload || {});
    await event.save();
    updated += 1;
  }
  console.log(`Redacted ${updated} Razorpay event logs.`);
}

redact()
  .catch((error) => {
    console.error("Razorpay event-log redaction failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
