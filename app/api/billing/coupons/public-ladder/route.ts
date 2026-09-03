import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/coupon";
import { creditThresholdFor } from "@/lib/billing/coupon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The discount ladder, for public marketing copy.
 *
 * Returns only what a banner needs to describe an offer truthfully — the code,
 * the percent, and the balance ceiling that qualifies you. No user, no wallet,
 * no eligibility: this endpoint cannot tell you whether YOU can redeem anything,
 * only what is currently on offer. `/api/billing/coupons/preview` is the
 * authenticated route that answers the personal question.
 *
 * Exposing codes is deliberate. They are printed on the billing page and they
 * circulate; what makes a threshold real is that `resolveCoupon` re-checks it at
 * redemption, not that the code is secret.
 *
 * `active: false` is the shipped default for every seeded coupon, so an empty
 * array is the expected response until an operator turns one on.
 */
export async function GET() {
  try {
    await dbConnect();

    const coupons = await Coupon.find({ active: true })
      .select("code percent maxCredits")
      .lean();

    const ladder = coupons
      .map((coupon) => {
        const threshold = creditThresholdFor(coupon);
        return {
          code: coupon.code,
          percent: coupon.percent,
          // Infinity has no JSON representation; null is the wire form of "no ceiling".
          maxCredits: Number.isFinite(threshold) ? threshold : null,
        };
      })
      .sort((a, b) => b.percent - a.percent);

    return NextResponse.json({ data: { ladder } }, { status: 200 });
  } catch (error) {
    // The banner renders on every marketing page. A database blip must degrade
    // to "no offers" rather than surfacing an error there.
    console.error("public coupon ladder error:", error);
    return NextResponse.json({ data: { ladder: [] } }, { status: 200 });
  }
}
