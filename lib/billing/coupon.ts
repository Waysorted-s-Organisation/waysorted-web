import Coupon, { type ICoupon } from "@/models/coupon";
import CouponRedemption from "@/models/couponRedemption";
import { Types } from "mongoose";
import {
  checkCouponEligibility,
  quoteCouponDiscount,
  type CouponRejection,
  type DiscountQuote,
} from "@/lib/billing/coupon-discount";

export type CouponResolution =
  | { ok: true; coupon: ICoupon & { _id: unknown }; quote: DiscountQuote }
  | { ok: false; reason: CouponRejection | "coupon_not_found" | "coupon_exhausted" | "coupon_already_used" };

/**
 * How many credits a customer may hold and still be offered each code.
 *
 * The four codes are surfaced by credit-threshold modals — WELCOME15 at a
 * healthy balance, UNLOCK30 at zero. Nothing about a static string binds it to
 * the state that produced it, and these codes will circulate. Enforcing the
 * threshold server-side at redemption is what makes "exclusively for you" true
 * rather than decorative.
 *
 * A code absent from this map has no balance requirement.
 */
export const COUPON_MAX_CREDITS: Readonly<Record<string, number>> = Object.freeze({
  WELCOME15: Number.POSITIVE_INFINITY,
  BOOST20: 50,
  TOPUP25: 25,
  UNLOCK30: 0,
});

export function creditThresholdFor(code: string): number {
  const limit = COUPON_MAX_CREDITS[code.trim().toUpperCase()];
  return limit === undefined ? Number.POSITIVE_INFINITY : limit;
}

/**
 * Resolve a code for one user and one product, returning what it is worth.
 *
 * Read-only. The claim is taken separately by reserveCoupon, because the
 * reservation must happen inside the same flow that calls the provider and
 * must be releasable if that call fails.
 */
/**
 * The best discount this customer could actually use right now.
 *
 * Read from the database rather than from a list in the client, because only
 * the server knows which codes are switched on, which ones this customer has
 * already spent, and whether their balance clears each code's ceiling. The
 * checkout banner used to advertise a fixed string - "Spend 30 credits and a
 * discount code unlocks automatically" - which matched neither the real
 * thresholds nor whether any code was live at all.
 *
 * Every candidate goes through the same resolveCoupon the checkout uses, so the
 * offer shown is one that will actually be honoured. Returns null when there is
 * nothing to offer, and the banner then says nothing rather than promising a
 * discount that would be refused.
 */
export async function resolveBestOfferForUser(options: {
  userId: string;
  productCode: string;
  amountPaise: number;
  currency: string;
  creditsRemaining?: number | null;
  heldCredits?: number | null;
  now?: Date;
}): Promise<DiscountQuote | null> {
  const now = options.now || new Date();
  const candidates = await Coupon.find({
    active: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  })
    .select("code percent")
    // Best first, so the customer is offered the largest discount they qualify
    // for rather than whichever happened to be created first.
    .sort({ percent: -1 })
    .lean<{ code: string; percent: number }[]>();

  for (const candidate of candidates) {
    const resolution = await resolveCoupon({ ...options, code: candidate.code, now });
    if (resolution.ok) return resolution.quote;
  }
  return null;
}

export async function resolveCoupon(options: {
  code: string;
  userId: string;
  productCode: string;
  amountPaise: number;
  currency: string;
  creditsRemaining?: number | null;
  /** Credits reserved by in-flight work. Counted, or the gate is free to defeat. */
  heldCredits?: number | null;
  now?: Date;
}): Promise<CouponResolution> {
  const normalized = options.code.trim().toUpperCase();
  if (!normalized) return { ok: false, reason: "coupon_not_found" };

  const coupon = await Coupon.findOne({ code: normalized });
  if (!coupon) return { ok: false, reason: "coupon_not_found" };

  const eligibility = checkCouponEligibility(coupon, options.productCode, options.now);
  if (!eligibility.ok) return { ok: false, reason: eligibility.reason };

  // Balance gate, on credits HELD as well as available.
  //
  // availableCredits excludes credits reserved by an in-flight operation, so
  // gating on it alone is defeatable for free: start work that reserves your
  // balance, watch available drop to zero, take UNLOCK30, then release the
  // reservation and get the credits back. The customer's real balance is the
  // sum, and that is what the modal was reacting to.
  //
  // Checked before the global cap so someone simply not eligible is told that,
  // rather than being told the code ran out.
  const threshold = creditThresholdFor(normalized);
  const effectiveCredits =
    typeof options.creditsRemaining === "number"
      ? options.creditsRemaining + (options.heldCredits ?? 0)
      : null;
  if (Number.isFinite(threshold) && effectiveCredits !== null && effectiveCredits > threshold) {
    return { ok: false, reason: "coupon_not_applicable" };
  }

  if (coupon.maxRedemptions !== null && coupon.maxRedemptions !== undefined) {
    // Counted over live claims only, so released reservations return supply to
    // the pool instead of permanently consuming it.
    const claimed = await CouponRedemption.countDocuments({
      coupon: coupon._id,
      status: { $in: ["reserved", "redeemed"] },
    });
    if (claimed >= coupon.maxRedemptions) return { ok: false, reason: "coupon_exhausted" };
  }

  // Only a REDEEMED row proves the code is spent. A reserved one is a claim in
  // flight — most often the customer's own previous attempt after a declined
  // card, which they were explicitly told to retry. Rejecting here made
  // reserveCoupon's reuse branch unreachable and turned one declined card into
  // a permanent lockout from the code, recoverable only by a reconciler sweep
  // hours later.
  const spent = await CouponRedemption.findOne({
    coupon: coupon._id,
    user: options.userId,
    status: "redeemed",
  }).select({ _id: 1 });
  if (spent) return { ok: false, reason: "coupon_already_used" };

  const quoted = quoteCouponDiscount({
    originalAmountPaise: options.amountPaise,
    percent: coupon.percent,
    currency: options.currency,
    code: normalized,
  });
  if (!quoted.ok) return { ok: false, reason: quoted.reason };

  return { ok: true, coupon: coupon as never, quote: quoted.quote };
}

export type ReserveResult =
  | { ok: true; redemptionId: string; reused: boolean }
  | { ok: false; reason: "coupon_already_used" };

/**
 * Take the claim, before the provider is called.
 *
 * Reserving after the provider call would leave a paid, discounted
 * subscription with no record that the code was spent. Reserving before means
 * a failed provider call must release, which the caller does.
 *
 * A collision on unique(purchase) is benign and reused: a declined card is
 * routine and the customer is told to retry, so their second attempt hits their
 * own reservation. Rejecting that would let one declined card lock a customer
 * out of a code permanently.
 */
export async function reserveCoupon(options: {
  couponId: unknown;
  userId: string;
  purchaseId: string;
  code: string;
  discountPaise: number;
  currency: string;
}): Promise<ReserveResult> {
  try {
    const created = await CouponRedemption.create({
      coupon: options.couponId,
      user: options.userId,
      purchase: options.purchaseId,
      code: options.code,
      discountPaise: options.discountPaise,
      currency: options.currency,
      status: "reserved",
      reservedAt: new Date(),
    });
    return { ok: true, redemptionId: String(created._id), reused: false };
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error;

    // Distinguish the two unique indexes by which row already exists, not by
    // parsing the driver's message — index names are not a stable contract.
    const mine = await CouponRedemption.findOne({
      purchase: options.purchaseId,
      user: options.userId,
    });
    if (mine && String(mine.coupon) === String(options.couponId)) {
      if (mine.status === "released") {
        // Conditional, and allowed to fail. Re-reserving in place can itself
        // violate the per-user index if the customer has since taken a claim on
        // another code, and a save() that threw here would escape as an
        // unhandled E11000 rather than the clear answer the caller expects.
        try {
          const revived = await CouponRedemption.updateOne(
            { _id: mine._id, status: "released" },
            {
              $set: { status: "reserved", reservedAt: new Date() },
              $unset: { releasedAt: "", releaseReason: "" },
            },
          );
          if (revived.modifiedCount !== 1) return { ok: false, reason: "coupon_already_used" };
        } catch (reviveError) {
          if ((reviveError as { code?: number })?.code === 11000) {
            return { ok: false, reason: "coupon_already_used" };
          }
          throw reviveError;
        }
      }
      return { ok: true, redemptionId: String(mine._id), reused: true };
    }

    // A live claim on this coupon by this user, belonging to a DIFFERENT
    // purchase. That is the per-user limit doing its job.
    return { ok: false, reason: "coupon_already_used" };
  }
}

/** reserved -> redeemed. Idempotent: a second call on a redeemed row is a no-op. */
export async function redeemCoupon(options: {
  purchaseId?: string | null;
  subscriptionId?: string | null;
}): Promise<boolean> {
  const filter: Record<string, unknown> = { status: "reserved" };
  if (options.purchaseId) filter.purchase = options.purchaseId;
  else if (options.subscriptionId) filter.subscriptionId = options.subscriptionId;
  else return false;

  const result = await CouponRedemption.updateOne(filter, {
    $set: { status: "redeemed", redeemedAt: new Date() },
  });
  return result.modifiedCount > 0;
}

/**
 * reserved -> released, freeing the code.
 *
 * Only a reserved row is released. A redeemed one represents money that
 * actually moved, and unwinding it belongs to refund handling, which has to
 * decide about the credits as well.
 */
export async function releaseCoupon(options: {
  purchaseId?: string | null;
  subscriptionId?: string | null;
  redemptionId?: string | null;
  reason: string;
}): Promise<boolean> {
  const filter: Record<string, unknown> = { status: "reserved" };
  if (options.redemptionId) filter._id = options.redemptionId;
  else if (options.purchaseId) filter.purchase = options.purchaseId;
  else if (options.subscriptionId) filter.subscriptionId = options.subscriptionId;
  else return false;

  const result = await CouponRedemption.updateOne(filter, {
    $set: { status: "released", releasedAt: new Date(), releaseReason: options.reason },
  });
  return result.modifiedCount > 0;
}

/**
 * The one release reason that means the money went BACK to the customer.
 *
 * Every other reason - an orphan sweep, an abandoned checkout, a superseded
 * retry - is a race that a late settlement is allowed to win. This one is a
 * decision made after a refund settled, and re-claiming it charges a customer
 * their one-per-user allowance for a purchase they were made whole on.
 */
export const COUPON_RELEASE_REASON_REFUNDED = "first_cycle_refunded";

/**
 * redeemed -> released, after the money has been given back.
 *
 * Separate from releaseCoupon, which deliberately refuses to touch a redeemed
 * row: unwinding a redemption is only correct once a refund has actually
 * settled, and that decision belongs to refund handling. Without this, a
 * refunded first cycle left the customer's single promotional allowance
 * permanently consumed for a purchase they got no benefit from.
 */
export async function releaseRedeemedCoupon(options: {
  purchaseId?: string | null;
  subscriptionId?: string | null;
  reason: string;
}): Promise<boolean> {
  const filter: Record<string, unknown> = { status: "redeemed" };
  if (options.purchaseId) filter.purchase = options.purchaseId;
  else if (options.subscriptionId) filter.subscriptionId = options.subscriptionId;
  else return false;

  const result = await CouponRedemption.updateOne(filter, {
    $set: { status: "released", releasedAt: new Date(), releaseReason: options.reason },
  });
  return result.modifiedCount > 0;
}

/**
 * Marks a redemption spent once its money is confirmed to have moved.
 *
 * The single claim point for all three settlement proofs - the client
 * confirmation, the paid webhooks, and the cycle reconciler - so one tolerance
 * covers them all rather than each path inventing its own.
 *
 * Resolved by purchase OR subscription, because neither identifier is reliably
 * present. attachSubscriptionToRedemption only runs AFTER the provider call in
 * subscriptions/create, so any settlement that beats it - or any claim whose
 * subscription was never attached at all - matched nothing when this keyed on
 * subscriptionId alone, and the sweep then handed a paying customer their
 * one-per-user allowance back.
 *
 * Accepts a `released` row as well as a `reserved` one. The orphan sweep frees
 * any reservation older than the grace window whose purchase is not yet
 * captured, and it can legitimately win that race against a recovery that is
 * still in flight - so by the time settlement confirms the payment, the claim
 * may already have been handed back. Leaving it released would make the code
 * repeatable for a customer who has been charged.
 *
 * Never touches a wallet: this only records that the allowance was consumed.
 */
export async function claimRedemptionForSettledPurchase(
  target: string | { purchaseId?: string | null; subscriptionId?: string | null },
): Promise<boolean> {
  // A bare string is a provider subscription id - the shape the cycle reconciler
  // has always called this with.
  const options = typeof target === "string" ? { subscriptionId: target } : target;
  const purchaseId = options.purchaseId?.trim() || "";
  const subscriptionId = options.subscriptionId?.trim() || "";

  const identity: Array<Record<string, unknown>> = [];
  // Validated before it reaches the filter: an uncastable purchase id throws a
  // CastError for the WHOLE query, taking the subscription match down with it,
  // and a claim that never lands is a discount the customer can take again.
  if (purchaseId && Types.ObjectId.isValid(purchaseId)) identity.push({ purchase: purchaseId });
  if (subscriptionId) identity.push({ subscriptionId });
  if (!identity.length) return false;

  const result = await CouponRedemption.updateOne(
    {
      $or: identity,
      status: { $in: ["reserved", "released"] },
      // A refund release is the one the widened `released` tolerance must NOT
      // swallow. invoice.paid fires on renewals too, so a customer whose
      // discounted first cycle was refunded had the next full-price charge
      // silently re-consume the allowance the refund had just handed back -
      // locking them out of all four codes for a cycle they paid list price
      // for. Matches reserved rows too: releaseReason defaults to null.
      releaseReason: { $ne: COUPON_RELEASE_REASON_REFUNDED },
    },
    { $set: { status: "redeemed", redeemedAt: new Date() }, $unset: { releasedAt: "", releaseReason: "" } },
  );
  return result.modifiedCount > 0;
}

/**
 * Frees reservations that no path will ever conclude.
 *
 * Every targeted release keys on a purchase or a subscription that some other
 * flow must still be tracking. Several paths leave neither: the process dying
 * between reserving and attaching a subscription id, a customer cancelling a
 * pending checkout, a subscription.cancelled or halted webhook, or a local
 * write failing after the provider call. A reservation stranded that way blocks
 * the code for that customer forever and permanently consumes one unit of any
 * global cap.
 *
 * Deliberately conservative: only reservations older than the grace window, and
 * only where the purchase did not end up captured. A row whose money moved is
 * left alone for redeemCoupon to claim, however late it arrives.
 */
export async function sweepOrphanedReservations(options: {
  olderThanMs?: number;
  limit?: number;
} = {}): Promise<{ scanned: number; released: number }> {
  const olderThanMs = options.olderThanMs ?? 2 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - olderThanMs);

  const stale = await CouponRedemption.find({
    status: "reserved",
    reservedAt: { $lte: cutoff },
  })
    .sort({ reservedAt: 1 })
    .limit(options.limit ?? 100)
    .select({ _id: 1, purchase: 1, subscriptionId: 1 })
    .lean();

  if (!stale.length) return { scanned: 0, released: 0 };

  const { default: Purchase } = await import("@/models/purchase");
  // Anything settled is excluded by VALUE rather than by assuming "not pending
  // means dead" — a purchase can be captured long after its reservation was
  // taken, and releasing that would hand back a code that was genuinely used.
  const settled = await Purchase.find({
    _id: { $in: stale.map((row) => row.purchase) },
    status: { $in: ["captured", "refunded", "partially_refunded"] },
  })
    .select({ _id: 1 })
    .lean();
  const settledIds = new Set(settled.map((row) => String(row._id)));

  // Also exclude anything already attached to a subscription that has a
  // captured purchase under a DIFFERENT id - a retry creates a new purchase, and
  // the old reservation must not be freed while the customer is paying on the
  // new one.
  const subscriptionIds = stale.map((row) => row.subscriptionId).filter(Boolean);
  const paidSubscriptions = subscriptionIds.length
    ? await Purchase.find({
        razorpaySubscriptionId: { $in: subscriptionIds },
        status: { $in: ["captured", "refunded", "partially_refunded"] },
      })
        .select({ razorpaySubscriptionId: 1 })
        .lean()
    : [];
  const paidSubscriptionIds = new Set(
    paidSubscriptions.map((row) => String(row.razorpaySubscriptionId)),
  );

  const releasable = stale.filter(
    (row) =>
      !settledIds.has(String(row.purchase)) &&
      !(row.subscriptionId && paidSubscriptionIds.has(String(row.subscriptionId))),
  );
  if (!releasable.length) return { scanned: stale.length, released: 0 };

  const result = await CouponRedemption.updateMany(
    { _id: { $in: releasable.map((row) => row._id) }, status: "reserved" },
    { $set: { status: "released", releasedAt: new Date(), releaseReason: "orphaned_reservation" } },
  );
  return { scanned: stale.length, released: result.modifiedCount };
}

/** Records which provider subscription a reservation ended up attached to. */
export async function attachSubscriptionToRedemption(
  redemptionId: string,
  subscriptionId: string,
): Promise<void> {
  await CouponRedemption.updateOne({ _id: redemptionId }, { $set: { subscriptionId } });
}
