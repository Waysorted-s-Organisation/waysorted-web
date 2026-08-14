import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import Purchase from "@/models/purchase";
import dbConnect from "@/lib/db";
import { formatMoney, minorUnitMultiplier } from "@/lib/billing/money";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const purchases = await Purchase.find({ 
      user: auth.user._id,
      status: { $in: ["captured", "refunded", "partially_refunded"] } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      history: purchases.map(p => ({
        id: p._id,
        productCode: p.productCode,
        kind: p.kind,
        amount: p.amountPaise / minorUnitMultiplier(p.currency),
        amountSubunits: p.amountPaise,
        formattedAmount: formatMoney(p.amountPaise, p.currency),
        currency: p.currency,
        status: p.status,
        date: p.capturedAt || p.createdAt,
        receipt: p.receipt
      }))
    });
  } catch (error) {
    console.error("GET /api/billing/history error:", error);
    return NextResponse.json(
      { error: "Unable to load billing history" },
      { status: 500 },
    );
  }
}
