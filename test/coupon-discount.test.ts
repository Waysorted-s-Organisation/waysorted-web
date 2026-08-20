/**
 * The discount arithmetic and eligibility rules.
 *
 * These are the numbers a customer is charged, so the tests below are about
 * money going in the right direction rather than about the function returning
 * something. The two that matter most:
 *
 *   - rounding DIRECTION, because flooring undercharges on every redemption
 *   - the minimum-charge floor, because an upfront below `min: 100` writes a
 *     Purchase that fails validation AFTER the provider has been called,
 *     leaving a live subscription with no local record of it
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  PURCHASE_MINIMUM_SUBUNITS,
  checkCouponEligibility,
  couponScopedIdempotencyKey,
  quoteCouponDiscount,
} from "@/lib/billing/coupon-discount";

const base = { currency: "INR", code: "BOOST20" };

test("the spec's worked example reproduces exactly", () => {
  // ₹349.00 less 20% is ₹279.20 — the figure in the spec and in Razorpay's
  // checkout copy. If this drifts, the customer sees one number and is charged
  // another.
  const r = quoteCouponDiscount({ ...base, originalAmountPaise: 34900, percent: 20 });
  assert.ok(r.ok);
  assert.equal(r.quote.discountPaise, 6980);
  assert.equal(r.quote.upfrontAmountPaise, 27920);
  assert.equal(r.quote.originalAmountPaise, 34900);
});

test("the discount rounds, it never floors", () => {
  // 15% of 34900 is 5235 exactly; 15% of 34901 is 5235.15. Flooring is
  // invisible per-transaction and systematically undercharges.
  const exact = quoteCouponDiscount({ ...base, originalAmountPaise: 34900, percent: 15 });
  assert.ok(exact.ok);
  assert.equal(exact.quote.discountPaise, 5235);

  // 33333 * 30% = 9999.9 -> 10000 by rounding, 9999 by flooring.
  const rounds = quoteCouponDiscount({ ...base, originalAmountPaise: 33333, percent: 30 });
  assert.ok(rounds.ok);
  assert.equal(rounds.quote.discountPaise, 10000);
  assert.equal(rounds.quote.upfrontAmountPaise, 23333);
});

test("discount plus upfront always reconstructs the original", () => {
  // The invariant that keeps the books balanced: whatever rounding does, the
  // two halves must still sum to the price the customer was quoted.
  for (const amount of [10000, 34900, 74999, 149900, 33333, 100001]) {
    for (const percent of [1, 5, 15, 20, 30, 33, 50, 66, 99]) {
      const r = quoteCouponDiscount({ ...base, originalAmountPaise: amount, percent });
      if (!r.ok) continue;
      assert.equal(
        r.quote.discountPaise + r.quote.upfrontAmountPaise,
        amount,
        `${percent}% of ${amount} does not reconstruct`,
      );
    }
  }
});

test("an upfront below the purchase floor is rejected, not silently clamped", () => {
  // 99% of 100 leaves 1 subunit. Clamping would charge more than the customer
  // was shown; proceeding would write a Purchase that fails `min: 100`.
  const r = quoteCouponDiscount({ ...base, originalAmountPaise: 100, percent: 99 });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "coupon_amount_too_small");

  // Exactly at the floor is allowed.
  const atFloor = quoteCouponDiscount({ ...base, originalAmountPaise: 200, percent: 50 });
  assert.ok(atFloor.ok);
  assert.equal(atFloor.quote.upfrontAmountPaise, PURCHASE_MINIMUM_SUBUNITS);
});

test("100% is rejected by construction", () => {
  // The mechanism needs a real authorisation charge to establish the mandate,
  // so a zero upfront has no valid representation. This is not a policy choice
  // that can be relaxed by editing a bound.
  const r = quoteCouponDiscount({ ...base, originalAmountPaise: 34900, percent: 100 });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "coupon_not_applicable");
  assert.equal(quoteCouponDiscount({ ...base, originalAmountPaise: 34900, percent: 0 }).ok, false);
});

test("a non-integer or non-positive price is refused", () => {
  assert.equal(quoteCouponDiscount({ ...base, originalAmountPaise: 0, percent: 20 }).ok, false);
  assert.equal(quoteCouponDiscount({ ...base, originalAmountPaise: -34900, percent: 20 }).ok, false);
  assert.equal(quoteCouponDiscount({ ...base, originalAmountPaise: 349.5, percent: 20 }).ok, false);
});

test("both floors are enforced, and neither implies the other", () => {
  // The two floors genuinely differ by currency, so checking one is not enough.
  // KWD has 3 minor units, so minimumChargeSubunits is 1000 — ABOVE the
  // purchase floor of 100. An upfront of 500 clears `min: 100` and would be
  // written happily, then be rejected by the provider as below its minimum
  // chargeable amount, after the subscription already exists.
  const kwd = quoteCouponDiscount({
    originalAmountPaise: 5000,
    percent: 90,
    currency: "KWD",
    code: "BIG",
  });
  assert.equal(kwd.ok, false, "500 subunits clears min:100 but is under KWD's 1000 floor");
  assert.equal(kwd.ok === false && kwd.reason, "coupon_amount_too_small");

  const kwdOk = quoteCouponDiscount({
    originalAmountPaise: 5000,
    percent: 50,
    currency: "KWD",
    code: "BIG",
  });
  assert.ok(kwdOk.ok, "2500 clears KWD's floor");

  // JPY has 0 minor units, so its provider floor is 1 — BELOW the purchase
  // floor. Here `min: 100` is the binding constraint instead.
  const jpy = quoteCouponDiscount({
    originalAmountPaise: 150,
    percent: 50,
    currency: "JPY",
    code: "BIG",
  });
  assert.equal(jpy.ok, false, "75 clears JPY's floor of 1 but not the purchase min of 100");
});

test("eligibility: an empty product list means no product, not every product", () => {
  const now = new Date("2026-08-19T00:00:00Z");
  const r = checkCouponEligibility(
    { active: true, validFrom: null, validUntil: null, appliesToProductCodes: [] },
    "sub_month_1",
    now,
  );
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "coupon_not_applicable");
});

test("eligibility: inactive, not-yet-valid and expired are distinguishable", () => {
  const now = new Date("2026-08-19T00:00:00Z");
  const applies = { appliesToProductCodes: ["sub_month_1"] };

  assert.equal(
    checkCouponEligibility({ ...applies, active: false, validFrom: null, validUntil: null }, "sub_month_1", now).ok,
    false,
  );

  const early = checkCouponEligibility(
    { ...applies, active: true, validFrom: new Date("2026-09-01T00:00:00Z"), validUntil: null },
    "sub_month_1",
    now,
  );
  assert.equal(early.ok === false && early.reason, "coupon_not_started");

  const late = checkCouponEligibility(
    { ...applies, active: true, validFrom: null, validUntil: new Date("2026-08-01T00:00:00Z") },
    "sub_month_1",
    now,
  );
  assert.equal(late.ok === false && late.reason, "coupon_expired");

  const good = checkCouponEligibility(
    { ...applies, active: true, validFrom: new Date("2026-08-01T00:00:00Z"), validUntil: new Date("2026-09-01T00:00:00Z") },
    "sub_month_1",
    now,
  );
  assert.equal(good.ok, true);
});

test("the coupon is part of checkout identity", () => {
  // subscriptions/create reuses a Purchase by idempotency key and skips
  // createPurchaseRecord on that path. Without the code folded in, a coupon
  // applied on a retry would reuse a full-price Purchase row while Razorpay
  // charged the discounted upfront — and verify compares against that row.
  const bare = couponScopedIdempotencyKey("sub:user1:sub_month_1");
  assert.equal(bare, "sub:user1:sub_month_1");

  const withCode = couponScopedIdempotencyKey("sub:user1:sub_month_1", "boost20");
  assert.notEqual(withCode, bare);
  assert.match(withCode, /BOOST20$/, "the code must be normalised into the key");

  assert.equal(
    couponScopedIdempotencyKey("k", " boost20 "),
    couponScopedIdempotencyKey("k", "BOOST20"),
    "case and whitespace must not produce two different checkouts",
  );
  assert.notEqual(
    couponScopedIdempotencyKey("k", "BOOST20"),
    couponScopedIdempotencyKey("k", "UNLOCK30"),
    "two different codes must not share a checkout identity",
  );
});

test("the quoted code is normalised", () => {
  const r = quoteCouponDiscount({ ...base, code: "  boost20 ", originalAmountPaise: 34900, percent: 20 });
  assert.ok(r.ok);
  assert.equal(r.quote.code, "BOOST20");
});
