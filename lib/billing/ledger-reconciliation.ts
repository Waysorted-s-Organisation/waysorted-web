import CreditLedger from "@/models/creditLedger";
import UserBilling from "@/models/userBilling";
import Purchase from "@/models/purchase";

export async function inspectCreditLedgerConsistency(input: { limit?: number } = {}) {
  const limit = Math.max(1, Math.min(input.limit ?? 100, 500));
  const wallets = await UserBilling.find({}).select("user availableCredits heldCredits").limit(limit).lean();
  const summary = { scanned: wallets.length, consistent: 0, mismatched: 0, purchaseGrantLedgerMissing: 0 };

  for (const wallet of wallets) {
    const result = await CreditLedger.aggregate([
      { $match: { user: wallet.user } },
      { $group: { _id: null, total: { $sum: "$deltaCredits" } } },
    ]);
    const ledgerBalance = Number(result[0]?.total || 0);
    const walletBalance = Number(wallet.availableCredits) + Number(wallet.heldCredits);
    if (ledgerBalance === walletBalance) summary.consistent += 1;
    else summary.mismatched += 1;
  }
  const grantedPurchases = await Purchase.find({ grantApplied: true })
    .select("_id")
    .limit(limit)
    .lean();
  for (const purchase of grantedPurchases) {
    const hasLedger = await CreditLedger.exists({
      idempotencyKey: `purchase-grant:${purchase._id}`,
    });
    if (!hasLedger) summary.purchaseGrantLedgerMissing += 1;
  }
  return summary;
}
