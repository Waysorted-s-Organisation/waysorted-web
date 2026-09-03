/**
 * The schema and index guarantees that carry the money safety.
 *
 * The route cannot enforce "one redemption per user" in application code — a
 * check-then-write races with itself, and two concurrent checkouts both read
 * "not yet redeemed". So the guarantee lives in a partial unique index, and
 * these tests pin its exact shape. An index whose options drift is not a
 * failing test anywhere else; it is a silent loss of the constraint.
 */
import assert from "node:assert/strict";
import test from "node:test";
import Coupon from "@/models/coupon";
import CouponRedemption from "@/models/couponRedemption";
import Purchase from "@/models/purchase";

function indexNamed(schema: { indexes(): Array<[Record<string, unknown>, Record<string, unknown>]> }, name: string) {
  return schema.indexes().find(([, options]) => options?.name === name);
}

test("one purchase can never redeem twice", () => {
  const found = indexNamed(CouponRedemption.schema as never, "purchase_1");
  assert.ok(found, "purchase_1 index must exist");
  const [keys, options] = found;
  assert.deepEqual(keys, { purchase: 1 });
  assert.equal(options.unique, true);
});

test("one live promotional claim per user, across every coupon", () => {
  // Deliberately not scoped per coupon: the four codes are a ladder shown at
  // descending balances, so a per-coupon index would grant four allowances and
  // a churner could take four discounted first cycles with full credits.
  const found = indexNamed(CouponRedemption.schema as never, "user_1_active_promo");
  assert.ok(found, "user_1_active_promo index must exist");
  const [keys, options] = found;
  assert.deepEqual(keys, { user: 1 });
  assert.equal(options.unique, true);

  // The partial filter is the whole point. Without it a released reservation
  // would still occupy the slot, so one abandoned checkout would permanently
  // burn the code for a customer who paid nothing.
  assert.deepEqual(
    options.partialFilterExpression,
    { status: { $in: ["reserved", "redeemed"] } },
    "the filter must cover exactly the two statuses that consume the code",
  );
});

test("maxPerUser cannot claim a limit the index does not enforce", () => {
  // A partial unique index can only ever express 1. Letting this field hold an
  // arbitrary N would read as a working limit and behave as a different one.
  const path = Coupon.schema.path("maxPerUser") as unknown as {
    options: { min?: number; max?: number; default?: number };
  };
  assert.equal(path.options.default, 1);
  assert.equal(path.options.min, 1);
  assert.equal(path.options.max, 1, "the schema must refuse a value the index cannot honour");
});

test("a coupon is inactive until someone deliberately activates it", () => {
  const coupon = new Coupon({ code: "draft", percent: 20 });
  assert.equal(coupon.active, false, "a half-configured code must not be live");
  assert.deepEqual(coupon.appliesToProductCodes, [], "and must apply to nothing by default");
  assert.equal(coupon.code, "DRAFT", "codes are normalised so lookup cannot miss on case");
});

test("percent is bounded so a zero or negative upfront cannot be configured", () => {
  const tooHigh = new Coupon({ code: "FREE", percent: 100, active: true });
  assert.ok(tooHigh.validateSync()?.errors?.percent, "100% must not be storable");

  const tooLow = new Coupon({ code: "NONE", percent: 0, active: true });
  assert.ok(tooLow.validateSync()?.errors?.percent, "0% must not be storable");

  const fine = new Coupon({ code: "OK", percent: 99, active: true });
  assert.equal(fine.validateSync()?.errors?.percent, undefined);
});

test("a redemption starts reserved and records what was given away", () => {
  const redemption = new CouponRedemption({
    coupon: "000000000000000000000001",
    user: "000000000000000000000002",
    purchase: "000000000000000000000003",
    code: "boost20",
    discountPaise: 6980,
  });
  assert.equal(redemption.status, "reserved");
  assert.equal(redemption.code, "BOOST20");
  assert.ok(redemption.reservedAt instanceof Date);
  assert.equal(redemption.validateSync(), undefined);
});

test("purchase records the discount alongside what was charged, not instead of it", () => {
  // amountPaise must keep holding the amount CHARGED, so subscriptions/verify
  // continues comparing the payment against the right number with no edit.
  const purchase = new Purchase({
    user: "000000000000000000000002",
    productCode: "sub_month_1",
    kind: "subscription",
    amountPaise: 27920,
    originalAmountPaise: 34900,
    discountPaise: 6980,
    couponCode: "boost20",
    creditsGranted: 200,
    receipt: "rcpt_1",
    idempotencyKey: "key_1",
  });
  assert.equal(purchase.validateSync(), undefined);
  assert.equal(purchase.amountPaise, 27920, "amountPaise is the upfront actually charged");
  assert.equal(purchase.originalAmountPaise, 34900);
  assert.equal(purchase.couponCode, "BOOST20");

  // And a purchase without a coupon carries nulls, not zeros — so "no coupon"
  // and "a coupon worth nothing" stay distinguishable in the data.
  const plain = new Purchase({
    user: "000000000000000000000002",
    productCode: "sub_month_1",
    kind: "subscription",
    amountPaise: 34900,
    creditsGranted: 200,
    receipt: "rcpt_2",
    idempotencyKey: "key_2",
  });
  assert.equal(plain.validateSync(), undefined);
  assert.equal(plain.originalAmountPaise, null);
  assert.equal(plain.discountPaise, null);
  assert.equal(plain.couponCode, null);
});
