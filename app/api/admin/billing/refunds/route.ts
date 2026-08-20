import { NextRequest, NextResponse } from "next/server";
import Purchase from "@/models/purchase";
import { requireAdminUser } from "@/lib/billing/auth";
import { createRefundRecord, recordRefundAdjustment } from "@/lib/billing/db";
import { createRazorpayRefund } from "@/lib/billing/razorpay";
import { releaseRedeemedCoupon } from "@/lib/billing/coupon";

type RefundBody = {
  purchaseId?: string;
  amountPaise?: number;
  reason?: string;
};

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as RefundBody;
    const purchaseId = body.purchaseId?.trim() || "";

    if (!purchaseId) {
      return NextResponse.json({ error: "Missing purchaseId." }, { status: 400 });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase || !purchase.razorpayPaymentId) {
      return NextResponse.json({ error: "Purchase/payment not found." }, { status: 404 });
    }

    const amountPaise = Math.min(
      Math.max(body.amountPaise || purchase.amountPaise, 1),
      purchase.amountPaise,
    );

    const providerRefund = await createRazorpayRefund(purchase.razorpayPaymentId, {
      amountPaise,
      notes: {
        reason: body.reason?.trim() || "admin_refund",
        purchaseId: String(purchase._id),
      },
    });

    const refund = await createRefundRecord({
      purchase,
      amountPaise,
      paymentId: purchase.razorpayPaymentId,
      providerRefundId: String(providerRefund.id || ""),
      initiatedBy: String(admin.user._id),
      reason: body.reason?.trim() || null,
    });

    if (!refund.creditAdjustmentApplied) {
      await recordRefundAdjustment({
        purchase,
        amountPaise,
        refundId: String(refund._id),
      });
      refund.creditAdjustmentApplied = true;
      refund.status = "processed";
      await refund.save();
    }

    const isFullRefund = amountPaise >= purchase.amountPaise;

    // A full refund of a discounted first cycle gives the promotional allowance
    // back. Without this the customer keeps a spent claim for a purchase they
    // got no benefit from, and - since the allowance is one per user across
    // every code - they could never use any of them again.
    if (isFullRefund && purchase.couponCode) {
      await releaseRedeemedCoupon({
        purchaseId: String(purchase._id),
        reason: "first_cycle_refunded",
      }).catch((error) => {
        console.error("[billing] coupon release on refund failed", {
          purchaseId: String(purchase._id),
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    purchase.status = isFullRefund ? "refunded" : "partially_refunded";
    purchase.refundedAt = new Date();
    await purchase.save();

    return NextResponse.json({
      ok: true,
      refund,
      purchase,
    });
  } catch (error) {
    console.error("POST /api/admin/billing/refunds error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json({ error: "Unable to create refund." }, { status });
  }
}
