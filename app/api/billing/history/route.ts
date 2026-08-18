import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import Purchase from "@/models/purchase";
import CreditLedger from "@/models/creditLedger";
import dbConnect from "@/lib/db";
import { formatMoney, minorUnitMultiplier } from "@/lib/billing/money";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Include in-flight states. Hiding them meant a customer whose payment was captured but not yet
    // fulfilled, or whose checkout was still processing, saw "No transactions yet" - exactly when
    // they most needed to see that their money had been taken.
    const purchases = await Purchase.find({
      user: auth.user._id,
      status: { $in: ["captured", "refunded", "partially_refunded", "pending", "created"] },
    }).sort({ createdAt: -1 });

    // Recurring subscription cycles never create a Purchase - applySubscriptionCycleCredits writes
    // only a CreditLedger row - so a monthly subscriber would otherwise see exactly one transaction
    // ever, no matter how many times they were charged.
    const renewals = await CreditLedger.find({
      user: auth.user._id,
      idempotencyKey: { $regex: /^subscription-cycle:/ },
    })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const purchaseHistory = purchases.map((p) => ({
      id: String(p._id),
      productCode: p.productCode,
      kind: p.kind,
      amount: p.amountPaise / minorUnitMultiplier(p.currency),
      amountSubunits: p.amountPaise,
      formattedAmount: formatMoney(p.amountPaise, p.currency),
      currency: p.currency,
      status: p.status,
      date: p.capturedAt || p.createdAt,
      receipt: p.receipt,
      creditsGranted: (p.creditsGranted || 0) + (p.bonusCredits || 0),
    }));

    const renewalHistory = renewals.map((row) => {
      const entry = row as unknown as {
        _id: unknown;
        deltaCredits: number;
        createdAt: Date;
        subscriptionId?: unknown;
      };
      return {
        id: String(entry._id),
        productCode: null,
        kind: "subscription_renewal" as const,
        // A renewal is billed by Razorpay against the mandate; no local money record exists, so
        // report the credits delivered rather than inventing an amount.
        amount: null,
        amountSubunits: null,
        formattedAmount: null,
        currency: null,
        status: "captured" as const,
        date: entry.createdAt,
        receipt: null,
        creditsGranted: entry.deltaCredits,
      };
    });

    const at = (value: Date | undefined | null) => (value ? new Date(value).getTime() : 0);
    const history = [...purchaseHistory, ...renewalHistory].sort(
      (a, b) => at(b.date) - at(a.date),
    );

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("GET /api/billing/history error:", error);
    return NextResponse.json(
      { error: "Unable to load billing history" },
      { status: 500 },
    );
  }
}
