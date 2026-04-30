import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import Purchase from "@/models/purchase";
import dbConnect from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const purchases = await Purchase.find({ 
      user: auth.user._id,
      status: { $in: ["captured", "refunded", "partially_refunded"] } 
    }).sort({ createdAt: -1 });

    console.log(`[BillingHistory] Found ${purchases.length} purchases for user ${auth.user._id}`);

    return NextResponse.json({ 
      success: true, 
      history: purchases.map(p => ({
        id: p._id,
        productCode: p.productCode,
        kind: p.kind,
        amount: p.amountPaise / 100,
        currency: p.currency,
        status: p.status,
        date: p.capturedAt || p.createdAt,
        receipt: p.receipt
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
