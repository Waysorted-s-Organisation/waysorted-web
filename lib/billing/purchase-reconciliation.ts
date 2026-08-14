import Purchase from "@/models/purchase";
import { applyPurchaseCredits } from "@/lib/billing/db";
import { fetchRazorpayOrderPayments } from "@/lib/billing/razorpay";
import { validateCapturedRazorpayPayment } from "@/lib/billing/payment-verification";
import dbConnect from "@/lib/db";

const DEFAULT_MINIMUM_AGE_MS = 15 * 60_000;
const DEFAULT_LIMIT = 25;

export async function reconcilePendingOneTimePurchases(input: {
  minimumAgeMs?: number;
  limit?: number;
} = {}) {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();
  const cutoff = new Date(Date.now() - (input.minimumAgeMs ?? DEFAULT_MINIMUM_AGE_MS));
  const limit = Math.max(1, Math.min(input.limit ?? DEFAULT_LIMIT, 100));
  const purchases = await Purchase.find({
    kind: { $ne: "subscription" },
    grantApplied: false,
    $or: [
      { status: "captured" },
      {
        status: { $in: ["created", "pending"] },
        razorpayOrderId: { $exists: true, $nin: [null, ""] },
      },
    ],
    updatedAt: { $lte: cutoff },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);

  const summary = {
    scanned: purchases.length,
    reconciled: 0,
    stillPending: 0,
    failed: 0,
  };

  for (const purchase of purchases) {
    try {
      if (purchase.status === "captured") {
        await applyPurchaseCredits(purchase);
        summary.reconciled += 1;
        continue;
      }
      const orderId = String(purchase.razorpayOrderId);
      const response = await fetchRazorpayOrderPayments(orderId);
      const capturedPayment = (response.items || []).find(
        (payment) => String(payment.status).toLowerCase() === "captured",
      );
      if (!capturedPayment) {
        summary.stillPending += 1;
        continue;
      }

      const verifiedPayment = validateCapturedRazorpayPayment({
        payment: capturedPayment,
        purchase,
        expectedOrderId: orderId,
      });
      purchase.razorpayPaymentId ||= verifiedPayment.paymentId;
      purchase.status = "captured";
      purchase.capturedAt ||= new Date();
      await purchase.save();
      await applyPurchaseCredits(purchase);
      summary.reconciled += 1;
    } catch (error) {
      summary.failed += 1;
      console.error("Pending purchase reconciliation failed", {
        purchaseId: String(purchase._id),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}
