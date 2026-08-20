import { NextRequest, NextResponse } from "next/server";
import Purchase from "@/models/purchase";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getRazorpayConfig } from "@/lib/billing/env";
import { verifyRazorpaySubscriptionSignature } from "@/lib/billing/crypto";
import { fetchRazorpayPayment, fetchRazorpaySubscription } from "@/lib/billing/razorpay";
import { redeemCoupon } from "@/lib/billing/coupon";
import {
  applySubscriptionCycleCredits,
  findSubscriptionByProviderId,
} from "@/lib/billing/db";
import { buildSubscriptionCycleKey } from "@/lib/billing/webhook-payload";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type VerifySubscriptionBody = {
  purchaseId?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifySubscriptionBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser("billing:checkout"));
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaseId = body.purchaseId?.trim() || "";
    const subscriptionId = body.razorpay_subscription_id?.trim() || "";
    const paymentId = body.razorpay_payment_id?.trim() || "";
    const signature = body.razorpay_signature?.trim() || "";
    if (!purchaseId || !subscriptionId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing verification fields." }, { status: 400 });
    }

    if (!verifyRazorpaySubscriptionSignature({
      subscriptionId,
      paymentId,
      signature,
      secret: getRazorpayConfig().keySecret,
    })) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      user: auth.user._id,
      kind: "subscription",
      razorpaySubscriptionId: subscriptionId,
    });
    if (!purchase) return conflict("Subscription payment does not match this purchase.");

    const [payment, providerSubscription] = await Promise.all([
      fetchRazorpayPayment(paymentId),
      fetchRazorpaySubscription(subscriptionId),
    ]);
    if (payment.id !== paymentId || payment.subscription_id !== subscriptionId) {
      return conflict("Razorpay payment belongs to a different subscription.");
    }
    if (String(payment.status).toLowerCase() !== "captured") {
      return conflict("Razorpay payment is not captured.");
    }
    // purchase.amountPaise holds the amount CHARGED, so with a coupon this is
    // the discounted upfront and the exact-equality check stays correct.
    if (Number(payment.amount) !== purchase.amountPaise ||
        String(payment.currency).toUpperCase() !== String(purchase.currency).toUpperCase()) {
      // One case deserves more than a generic mismatch: the customer was shown
      // a discount, the addon did not apply, and they were charged full price.
      // Never silently accept that - it is a real overcharge against a promise
      // the UI made.
      if (purchase.couponCode && Number(payment.amount) === purchase.originalAmountPaise) {
        console.error("[billing] coupon addon did not apply; customer charged full price", {
          purchaseId: String(purchase._id),
          userId: String(purchase.user),
          couponCode: purchase.couponCode,
          expectedUpfront: purchase.amountPaise,
          chargedAmount: Number(payment.amount),
          paymentId,
          subscriptionId,
        });
        return conflict(
          "You were charged the full price instead of the discounted amount. We have flagged this for immediate correction.",
        );
      }
      return conflict("Razorpay payment amount does not match this purchase.");
    }
    if (
      providerSubscription.id !== subscriptionId ||
      String(providerSubscription.notes?.productCode || "") !== purchase.productCode
    ) {
      return conflict("Razorpay subscription does not match the selected plan.");
    }

    if (purchase.couponCode) {
      // The money has moved, so the claim is spent rather than merely held.
      await redeemCoupon({ purchaseId: String(purchase._id) }).catch((error) => {
        console.error("[billing] coupon redemption transition failed", {
          purchaseId: String(purchase._id),
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    purchase.razorpayPaymentId ||= paymentId;
    purchase.status = "captured";
    purchase.capturedAt ||= new Date();
    purchase.notes = {
      ...(purchase.notes || {}),
      clientSubscriptionConfirmation: {
        paymentId,
        subscriptionId,
        confirmedAt: new Date().toISOString(),
      },
    };
    purchase.markModified("notes");
    await purchase.save();

    // Deliver the first cycle's credits here rather than depending solely on subscription.charged.
    // That webhook was the ONLY code path granting subscription credits, with no reconciler and no
    // replay, so a single lost delivery meant the customer was charged and silently received
    // nothing - while subscription.activated still flipped the UI to "confirmed".
    //
    // Safe to do at this point: the payment has just been server-verified as captured, for this
    // subscription, at exactly the recorded amount and currency. The cycle key matches the one the
    // webhook would use, so the unique ledger index makes whichever arrives second a no-op.
    let creditsApplied = false;
    try {
      const subscription = await findSubscriptionByProviderId(subscriptionId);
      if (subscription) {
        await applySubscriptionCycleCredits({
          subscription,
          // Must come from the shared builder, never a local template literal. The webhook and the
          // renewal backstop both key off buildSubscriptionCycleKey; a second hand-written copy is
          // one edit away from diverging, and a diverged cycle key is exactly what credited the
          // first paying customer twice for a single payment.
          cycleKey: buildSubscriptionCycleKey(subscriptionId, paymentId),
          paymentId,
        });
        creditsApplied = true;

        // Record on the purchase that the grant was delivered.
        //
        // For a subscription the CYCLE path owns credits, and it never touches
        // this row - so grantApplied stayed false on every correctly-fulfilled
        // sale. findPaidButUnfulfilledPurchases selects exactly
        // {status:"captured", grantApplied:false} as its definition of
        // "customer paid and got nothing", and the daily cron returns HTTP 500
        // whenever that list is non-empty. So every correct subscription sale
        // would have turned the billing cron permanently red and buried every
        // other signal in it.
        //
        // Setting it also closes the double-grant door: applyPurchaseCredits
        // gates on grantApplied:false (db.ts:657-673), so this row can never be
        // credited a second time by another path.
        await Purchase.updateOne(
          { _id: purchase._id, grantApplied: false },
          { $set: { grantApplied: true } },
        );
      }
    } catch (creditError) {
      // Never fail verification over this - the payment is already captured and the webhook remains
      // a second chance. Log loudly so a silent zero-credit state is visible.
      console.error("[billing] first-cycle credit grant failed during subscription verify", {
        purchaseId: String(purchase._id),
        subscriptionId,
        paymentId,
        error: creditError instanceof Error ? creditError.message : String(creditError),
      });
    }

    return NextResponse.json({
      verified: true,
      purchaseId: String(purchase._id),
      subscriptionId,
      paymentId,
      creditsApplied,
      status: providerSubscription.status,
      authoritativeSource: "server_verified_payment",
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/verify error:", error);
    return NextResponse.json(
      { error: "Unable to verify subscription payment." },
      { status: 500 },
    );
  }
}
