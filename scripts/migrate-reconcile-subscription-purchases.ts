import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../lib/db";
import Purchase from "../models/purchase";
import {
  fetchRazorpayPayment,
  fetchRazorpaySubscriptionInvoices,
} from "../lib/billing/razorpay";

/**
 * Mark subscription purchases as captured when Razorpay confirms the money was actually taken.
 *
 * Before the subscription signature fix, /subscriptions/verify always failed (the HMAC operands were
 * reversed), so the Purchase row never flipped from `pending` to `captured` and razorpayPaymentId was
 * never written. Credits still arrived, because the webhook grants them directly without touching the
 * Purchase row - so entitlement is correct while the money side has no record of the payment.
 *
 * The consequence is that revenue reporting returns nothing, a refund cannot be reconciled against
 * the original purchase, and anything filtering on `status: "captured"` misses real customers.
 *
 * This NEVER touches credits. grantApplied and the wallet are left exactly as they are: the credits
 * were already delivered by the webhook, and re-running fulfilment would credit the customer again.
 * Only the money record is repaired.
 *
 * Every write is gated on a live check against Razorpay: the invoice must be paid, the payment must
 * be captured, and its amount, currency and subscription must all match the local record. Anything
 * that does not match is reported and skipped rather than guessed at.
 *
 * Usage:
 *   npm run migrate:reconcile-subscription-purchases -- --dry-run
 *   npm run migrate:reconcile-subscription-purchases
 */

const DRY_RUN = process.argv.includes("--dry-run");

type Mismatch = { purchaseId: string; reason: string };

async function migrate() {
  await dbConnect();

  const candidates = await Purchase.find({
    kind: "subscription",
    status: { $in: ["created", "pending"] },
    razorpaySubscriptionId: { $regex: /^sub_/ },
  });

  if (!candidates.length) {
    console.log("No subscription purchases awaiting reconciliation.");
    return;
  }

  console.log(`Found ${candidates.length} subscription purchase(s) not marked captured.\n`);

  const repaired: string[] = [];
  const skipped: Mismatch[] = [];

  for (const purchase of candidates) {
    const subscriptionId = String(purchase.razorpaySubscriptionId);
    const label = `${String(purchase._id)} (${subscriptionId}, ${purchase.currency} ${(purchase.amountPaise / 100).toFixed(2)})`;

    try {
      const invoices = await fetchRazorpaySubscriptionInvoices(subscriptionId);
      const paid = (invoices.items || [])
        .filter((invoice) => String(invoice.status || "").toLowerCase() === "paid" && invoice.payment_id)
        // Oldest paid invoice is the one this Purchase row represents: the first cycle.
        .sort((a, b) => Number(a.paid_at || 0) - Number(b.paid_at || 0));

      if (!paid.length) {
        skipped.push({ purchaseId: label, reason: "no paid invoice at Razorpay - customer never paid" });
        continue;
      }

      const invoice = paid[0];
      const paymentId = String(invoice.payment_id);
      const payment = await fetchRazorpayPayment(paymentId);

      if (String(payment.status).toLowerCase() !== "captured") {
        skipped.push({ purchaseId: label, reason: `payment ${paymentId} is ${payment.status}, not captured` });
        continue;
      }
      if (Number(payment.amount) !== purchase.amountPaise) {
        skipped.push({
          purchaseId: label,
          reason: `amount mismatch: Razorpay ${payment.amount} vs local ${purchase.amountPaise}`,
        });
        continue;
      }
      if (String(payment.currency).toUpperCase() !== String(purchase.currency).toUpperCase()) {
        skipped.push({
          purchaseId: label,
          reason: `currency mismatch: Razorpay ${payment.currency} vs local ${purchase.currency}`,
        });
        continue;
      }

      console.log(`  REPAIR ${label}`);
      console.log(`    payment ${paymentId} captured, ${payment.currency} ${Number(payment.amount) / 100} - matches`);
      console.log(`    -> status: ${purchase.status} -> captured, razorpayPaymentId set`);
      console.log(`    -> grantApplied left as ${purchase.grantApplied} (credits already delivered by webhook)`);

      if (!DRY_RUN) {
        purchase.status = "captured";
        purchase.razorpayPaymentId ||= paymentId;
        purchase.capturedAt ||= invoice.paid_at ? new Date(invoice.paid_at * 1000) : new Date();
        purchase.notes = {
          ...(purchase.notes || {}),
          reconciledAt: new Date().toISOString(),
          reconciledReason:
            "Captured at Razorpay but never recorded locally: /subscriptions/verify failed before the signature fix.",
        };
        purchase.markModified("notes");
        await purchase.save();
      }
      repaired.push(label);
    } catch (error) {
      skipped.push({
        purchaseId: label,
        reason: `lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  if (skipped.length) {
    console.log("\nSkipped (left untouched):");
    skipped.forEach((s) => console.log(`  ${s.purchaseId}\n    ${s.reason}`));
  }

  console.log(
    DRY_RUN
      ? `\n--dry-run: nothing written. ${repaired.length} would be repaired, ${skipped.length} skipped.`
      : `\nRepaired ${repaired.length} purchase(s); ${skipped.length} skipped. Credits and wallets untouched.`,
  );
}

migrate()
  .catch((error) => {
    console.error("Subscription purchase reconciliation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
