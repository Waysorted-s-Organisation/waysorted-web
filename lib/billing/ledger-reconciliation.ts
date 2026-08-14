import CreditLedger from "@/models/creditLedger";
import UserBilling from "@/models/userBilling";
import Purchase from "@/models/purchase";
import dbConnect from "@/lib/db";

export async function inspectCreditLedgerConsistency(input: { limit?: number } = {}) {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();
  const limit = Math.max(1, Math.min(input.limit ?? 100, 500));
  // Sort newest-first so a growing wallet table cannot permanently hide recent drift behind the
  // first `limit` documents in natural order.
  const wallets = await UserBilling.find({})
    .select("user availableCredits heldCredits")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  const summary = {
    scanned: wallets.length,
    consistent: 0,
    mismatched: 0,
    purchaseGrantLedgerMissing: 0,
    // Identify the affected records: a bare count cannot be acted on.
    mismatchedUsers: [] as string[],
    missingLedgerPurchases: [] as string[],
  };

  for (const wallet of wallets) {
    const result = await CreditLedger.aggregate([
      { $match: { user: wallet.user } },
      { $group: { _id: null, total: { $sum: "$deltaCredits" } } },
    ]);
    const ledgerBalance = Number(result[0]?.total || 0);
    const walletBalance = Number(wallet.availableCredits) + Number(wallet.heldCredits);
    if (ledgerBalance === walletBalance) {
      summary.consistent += 1;
    } else {
      summary.mismatched += 1;
      summary.mismatchedUsers.push(String(wallet.user));
    }
  }
  const grantedPurchases = await Purchase.find({ grantApplied: true })
    .select("_id")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  for (const purchase of grantedPurchases) {
    const hasLedger = await CreditLedger.exists({
      idempotencyKey: `purchase-grant:${purchase._id}`,
    });
    if (!hasLedger) {
      summary.purchaseGrantLedgerMissing += 1;
      summary.missingLedgerPurchases.push(String(purchase._id));
    }
  }
  return summary;
}
