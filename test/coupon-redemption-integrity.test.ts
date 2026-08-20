/**
 * The redemption guarantees, against a real MongoDB with the real indexes.
 *
 * Every other coupon test reads source text. That is enough to catch a call
 * site going missing, and useless for the thing that actually protects the
 * money: a partial unique index either enforces its predicate under concurrency
 * or it does not, and no amount of reading the schema tells you which. These
 * tests build the indexes and try to break them.
 *
 * What is proven here:
 *   - the same code cannot be spent twice by one customer, even concurrently
 *   - the four-code ladder is ONE allowance, not four
 *   - a declined card does not lock the customer out of their retry
 *   - a released claim genuinely frees the allowance
 *   - the orphan sweeper frees stranded claims and leaves paid ones alone
 */
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Coupon from "@/models/coupon";
import CouponRedemption from "@/models/couponRedemption";
import Purchase from "@/models/purchase";
import {
  claimRedemptionForSettledPurchase,
  releaseCoupon,
  releaseRedeemedCoupon,
  redeemCoupon,
  reserveCoupon,
  sweepOrphanedReservations,
} from "@/lib/billing/coupon";

let server: MongoMemoryServer;
const USER = new mongoose.Types.ObjectId();
const OTHER_USER = new mongoose.Types.ObjectId();

before(async () => {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { dbName: "coupon_integrity" });
  // The whole point: build the indexes the production migration builds.
  await CouponRedemption.syncIndexes();
  await Coupon.syncIndexes();
});

after(async () => {
  await mongoose.disconnect();
  await server?.stop();
});

beforeEach(async () => {
  await CouponRedemption.deleteMany({});
  await Coupon.deleteMany({});
  await Purchase.deleteMany({});
});

async function makeCoupon(code: string, percent: number) {
  return Coupon.create({
    code,
    percent,
    appliesToProductCodes: ["sub_month_1"],
    active: true,
  });
}

function purchaseId() {
  return new mongoose.Types.ObjectId();
}

test("the same customer cannot hold two live claims, even concurrently", async () => {
  const coupon = await makeCoupon("BOOST20", 20);

  // Two simultaneous checkouts, two different purchases. A check-then-write in
  // application code races here; the index must not.
  const results = await Promise.all([
    reserveCoupon({
      couponId: coupon._id,
      userId: String(USER),
      purchaseId: String(purchaseId()),
      code: "BOOST20",
      discountPaise: 2980,
      currency: "INR",
    }),
    reserveCoupon({
      couponId: coupon._id,
      userId: String(USER),
      purchaseId: String(purchaseId()),
      code: "BOOST20",
      discountPaise: 2980,
      currency: "INR",
    }),
  ]);

  const granted = results.filter((r) => r.ok).length;
  assert.equal(granted, 1, "exactly one concurrent reservation may win");
  assert.equal(
    await CouponRedemption.countDocuments({ user: USER, status: { $in: ["reserved", "redeemed"] } }),
    1,
  );
});

test("the four-code ladder is one allowance, not four", async () => {
  // WELCOME15 -> BOOST20 -> TOPUP25 -> UNLOCK30 are shown at descending
  // balances. Scoped per coupon, a churner takes all four discounted first
  // cycles, each with FULL credits, each cancellable before the full-price
  // charge. That is a permanent discount, not a promotion.
  const codes = [
    ["WELCOME15", 15],
    ["BOOST20", 20],
    ["TOPUP25", 25],
    ["UNLOCK30", 30],
  ] as const;

  let granted = 0;
  for (const [code, percent] of codes) {
    const coupon = await makeCoupon(code, percent);
    const result = await reserveCoupon({
      couponId: coupon._id,
      userId: String(USER),
      purchaseId: String(purchaseId()),
      code,
      discountPaise: 100,
      currency: "INR",
    });
    if (result.ok) granted += 1;
  }

  assert.equal(granted, 1, "one promotional claim per customer across every code");
});

test("a different customer is unaffected by someone else's claim", async () => {
  const coupon = await makeCoupon("BOOST20", 20);
  const mine = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: String(purchaseId()),
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });
  const theirs = await reserveCoupon({
    couponId: coupon._id, userId: String(OTHER_USER), purchaseId: String(purchaseId()),
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });
  assert.ok(mine.ok && theirs.ok, "the limit is per user, not global");
});

test("a declined card does not lock the customer out of their own retry", async () => {
  const coupon = await makeCoupon("UNLOCK30", 30);
  const purchase = String(purchaseId());

  const first = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: purchase,
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
  });
  assert.ok(first.ok);

  // The card is declined; the customer is told to retry and does.
  const retry = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: purchase,
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
  });
  assert.ok(retry.ok, "their own reservation must be reused, not refused");
  assert.equal(retry.ok && retry.reused, true);
  assert.equal(retry.ok && retry.redemptionId, first.ok && first.redemptionId);
  assert.equal(await CouponRedemption.countDocuments({ user: USER }), 1, "no duplicate row");
});

test("releasing frees the allowance; redeeming does not", async () => {
  const coupon = await makeCoupon("BOOST20", 20);
  const first = String(purchaseId());

  await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: first,
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });

  // Abandoned: the claim goes back.
  assert.equal(await releaseCoupon({ purchaseId: first, reason: "abandoned" }), true);
  const afterRelease = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: String(purchaseId()),
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });
  assert.ok(afterRelease.ok, "a released claim frees the customer to try again");

  // Redeemed: it does not.
  await redeemCoupon({ purchaseId: String((afterRelease as { redemptionId: string }) && "") }).catch(() => null);
  await CouponRedemption.updateOne(
    { _id: afterRelease.ok ? afterRelease.redemptionId : null },
    { $set: { status: "redeemed", redeemedAt: new Date() } },
  );
  const afterRedeem = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: String(purchaseId()),
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });
  assert.equal(afterRedeem.ok, false, "a spent claim must not be reusable");
});

test("release refuses to touch a redeemed row, and the refund path can", async () => {
  const coupon = await makeCoupon("TOPUP25", 25);
  const purchase = String(purchaseId());
  const reserved = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: purchase,
    code: "TOPUP25", discountPaise: 3725, currency: "INR",
  });
  assert.ok(reserved.ok);
  assert.equal(await redeemCoupon({ purchaseId: purchase }), true);

  // Money moved: the ordinary release must not unwind it.
  assert.equal(await releaseCoupon({ purchaseId: purchase, reason: "abandoned" }), false);
  assert.equal((await CouponRedemption.findOne({ purchase }))?.status, "redeemed");

  // A refund is the one thing that may.
  assert.equal(await releaseRedeemedCoupon({ purchaseId: purchase, reason: "refunded" }), true);
  assert.equal((await CouponRedemption.findOne({ purchase }))?.status, "released");

  const afterRefund = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: String(purchaseId()),
    code: "TOPUP25", discountPaise: 3725, currency: "INR",
  });
  assert.ok(afterRefund.ok, "a refunded customer gets their allowance back");
});

test("redeeming twice is idempotent", async () => {
  const coupon = await makeCoupon("BOOST20", 20);
  const purchase = String(purchaseId());
  await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: purchase,
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });

  // verify and the subscription.charged webhook can both fire, in either order.
  assert.equal(await redeemCoupon({ purchaseId: purchase }), true);
  assert.equal(await redeemCoupon({ purchaseId: purchase }), false, "second call is a no-op");
  assert.equal(await CouponRedemption.countDocuments({ purchase, status: "redeemed" }), 1);
});

test("the sweeper frees stranded claims and leaves paid ones alone", async () => {
  const coupon = await makeCoupon("UNLOCK30", 30);

  // Stranded: reserved long ago, purchase never captured, no subscription id —
  // the shape that no targeted release can find.
  const strandedPurchase = await Purchase.create({
    user: USER, productCode: "sub_month_1", kind: "subscription",
    amountPaise: 10430, creditsGranted: 200, receipt: "r1", idempotencyKey: "k1",
    status: "pending",
  });
  await CouponRedemption.create({
    coupon: coupon._id, user: USER, purchase: strandedPurchase._id,
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
    status: "reserved", reservedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  });

  // Paid but slow to confirm: same age, but the purchase settled.
  const paidPurchase = await Purchase.create({
    user: OTHER_USER, productCode: "sub_month_1", kind: "subscription",
    amountPaise: 10430, creditsGranted: 200, receipt: "r2", idempotencyKey: "k2",
    status: "captured",
  });
  await CouponRedemption.create({
    coupon: coupon._id, user: OTHER_USER, purchase: paidPurchase._id,
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
    status: "reserved", reservedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  });

  const result = await sweepOrphanedReservations({ olderThanMs: 2 * 60 * 60 * 1000 });
  assert.equal(result.released, 1, "only the stranded claim is freed");

  assert.equal((await CouponRedemption.findOne({ user: USER }))?.status, "released");
  assert.equal(
    (await CouponRedemption.findOne({ user: OTHER_USER }))?.status,
    "reserved",
    "a captured purchase must never have its claim handed back",
  );
});

test("the sweeper leaves recent reservations alone", async () => {
  const coupon = await makeCoupon("BOOST20", 20);
  const purchase = await Purchase.create({
    user: USER, productCode: "sub_month_1", kind: "subscription",
    amountPaise: 11920, creditsGranted: 200, receipt: "r3", idempotencyKey: "k3",
    status: "pending",
  });
  await CouponRedemption.create({
    coupon: coupon._id, user: USER, purchase: purchase._id,
    code: "BOOST20", discountPaise: 2980, currency: "INR",
    status: "reserved", reservedAt: new Date(),
  });

  const result = await sweepOrphanedReservations({ olderThanMs: 2 * 60 * 60 * 1000 });
  assert.equal(result.released, 0, "a checkout in progress must not be swept out from under it");
});

test("one purchase can never carry two redemptions", async () => {
  const first = await makeCoupon("BOOST20", 20);
  const second = await makeCoupon("UNLOCK30", 30);
  const purchase = String(purchaseId());

  const a = await reserveCoupon({
    couponId: first._id, userId: String(USER), purchaseId: purchase,
    code: "BOOST20", discountPaise: 2980, currency: "INR",
  });
  assert.ok(a.ok);

  // A different code against the same purchase: refused, not stacked.
  const b = await reserveCoupon({
    couponId: second._id, userId: String(USER), purchaseId: purchase,
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
  });
  assert.equal(b.ok, false, "coupons must not stack on one purchase");
  assert.equal(await CouponRedemption.countDocuments({ purchase }), 1);
});

test("settlement claims a redemption the sweep already released", async () => {
  // The recovery path had no coupon awareness: a subscription rescued by the
  // reconciler kept a merely RESERVED claim, which the orphan sweep then freed
  // two hours later even though the money had moved. The customer got the
  // discount and kept the allowance, making the code repeatable.
  const coupon = await makeCoupon("UNLOCK30", 30);
  const purchase = String(purchaseId());
  await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: purchase,
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
  });
  await CouponRedemption.updateOne({ purchase }, { $set: { subscriptionId: "sub_recovered" } });

  // The sweep wins the race first.
  await releaseCoupon({ purchaseId: purchase, reason: "orphaned_reservation" });
  assert.equal((await CouponRedemption.findOne({ purchase }))?.status, "released");

  // Settlement then confirms the money moved and must reclaim it.
  assert.equal(await claimRedemptionForSettledPurchase("sub_recovered"), true);
  const after = await CouponRedemption.findOne({ purchase });
  assert.equal(after?.status, "redeemed");
  // null or undefined both mean cleared — the schema declares `default: null`,
  // so an $unset field reads back as null rather than absent.
  assert.ok(
    after?.releaseReason == null,
    `the release must be cleared, not left alongside a redeemed status (got ${JSON.stringify(after?.releaseReason)})`,
  );

  // And the allowance is genuinely spent afterwards.
  const again = await reserveCoupon({
    couponId: coupon._id, userId: String(USER), purchaseId: String(purchaseId()),
    code: "UNLOCK30", discountPaise: 4470, currency: "INR",
  });
  assert.equal(again.ok, false, "a paid claim must not be reusable");
});

test("the sweep never frees a claim whose subscription was paid", async () => {
  const coupon = await makeCoupon("BOOST20", 20);
  // The retry pattern: the reservation points at subscription X, and a purchase
  // under a DIFFERENT id has since been captured against that same subscription.
  const stalePurchase = await Purchase.create({
    user: USER, productCode: "sub_month_1", kind: "subscription",
    amountPaise: 11920, creditsGranted: 200, receipt: "r9", idempotencyKey: "k9",
    status: "pending",
  });
  await Purchase.create({
    user: USER, productCode: "sub_month_1", kind: "subscription",
    amountPaise: 11920, creditsGranted: 200, receipt: "r10", idempotencyKey: "k10",
    status: "captured", razorpaySubscriptionId: "sub_paid",
  });
  await CouponRedemption.create({
    coupon: coupon._id, user: USER, purchase: stalePurchase._id,
    code: "BOOST20", discountPaise: 2980, currency: "INR",
    subscriptionId: "sub_paid",
    status: "reserved", reservedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  });

  const result = await sweepOrphanedReservations({ olderThanMs: 2 * 60 * 60 * 1000 });
  assert.equal(result.released, 0, "a claim against a paid subscription must survive the sweep");
  assert.equal((await CouponRedemption.findOne({ user: USER }))?.status, "reserved");
});
