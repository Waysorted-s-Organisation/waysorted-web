/**
 * The redemption state machine and the wiring around it.
 *
 * Every transition here corresponds to money moving or not moving, and the one
 * that matters most is `released` — without it, a single abandoned checkout
 * permanently consumes a one-per-user code for a customer who paid nothing.
 *
 * These are source-level checks on the call sites plus behavioural checks on
 * the pure logic. The lifecycle functions themselves need a live Mongo
 * connection with the partial unique index actually built, which is what
 * `npm run harness:coupons` covers against test mode; asserting on a mocked
 * Mongoose here would prove the mock works, not the index.
 */
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { COUPON_MAX_CREDITS, creditThresholdFor } from "@/lib/billing/coupon";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

const createRoute = read("app/api/billing/subscriptions/create/route.ts");
const verifyRoute = read("app/api/billing/subscriptions/verify/route.ts");
const reconciliation = read("lib/billing/subscription-reconciliation.ts");
const webhooks = read("lib/billing/webhooks.ts");
const couponLib = read("lib/billing/coupon.ts");
const client = read("app/billing/billing-client.tsx");
const cancelRoute = read("app/api/billing/subscriptions/cancel/route.ts");
const userBilling = read("models/userBilling.ts");
const catalogLib = read("lib/billing/catalog.ts");
const cycleReconciler = read("lib/billing/subscription-cycle-reconciliation.ts");
const alerts = read("lib/billing/payment-alerts.ts");

test("each code is bound to the credit state that produced it", () => {
  // The modals promise "exclusively for you" at a credit threshold. Nothing
  // about a static string enforces that, and these codes will circulate.
  assert.equal(creditThresholdFor("UNLOCK30"), 0, "shown at zero credits");
  assert.equal(creditThresholdFor("TOPUP25"), 25);
  assert.equal(creditThresholdFor("BOOST20"), 50);
  assert.equal(COUPON_MAX_CREDITS.WELCOME15, Number.POSITIVE_INFINITY, "upgrade prompt, any balance");

  // An unknown code has no balance requirement rather than accidentally
  // inheriting the strictest one.
  assert.equal(creditThresholdFor("SOMETHING_ELSE"), Number.POSITIVE_INFINITY);

  // Case and padding must not defeat the gate.
  assert.equal(creditThresholdFor("  unlock30 "), 0);
});

test("the discount is quoted before the reuse branch decides", () => {
  // The reuse branch returns an existing subscription created WITHOUT an addon.
  // Reusing it for a coupon request charges full price while the UI promised a
  // discount — and verify would agree, because the purchase row would be full
  // price too.
  const resolveAt = createRoute.indexOf("await resolveCoupon(");
  const reuseAt = createRoute.indexOf("isFreshPendingSubscription || isReusablePendingSubscription");
  assert.ok(resolveAt > 0 && reuseAt > 0);
  assert.ok(resolveAt < reuseAt, "coupon resolution must precede the reuse decision");
  assert.match(
    createRoute,
    /reusedSubscriptionHonoursCoupon/,
    "the reuse branch must refuse a subscription that carries no matching addon",
  );
});

test("the claim is taken before the provider is called, and given back if it fails", () => {
  const reserveAt = createRoute.indexOf("await reserveCoupon(");
  const createAt = createRoute.indexOf("await createRazorpaySubscription(");
  assert.ok(reserveAt > 0 && createAt > 0);
  assert.ok(
    reserveAt < createAt,
    "reserving after the provider call would leave a paid subscription with no record the code was spent",
  );
  // And a provider failure must not permanently burn the code.
  assert.match(createRoute, /provider_subscription_create_failed/);
});

test("the quote guard compares against the upfront, not the list price", () => {
  // Comparing the client's quote against the full price would 409 every single
  // coupon checkout.
  assert.match(createRoute, /chargeAmountSubunits/);
  assert.match(
    createRoute,
    /body\.quotedAmountSubunits !== chargeAmountSubunits/,
    "the guard must use the charged amount",
  );
});

test("a full-price charge under a coupon is never silently accepted", () => {
  // The customer was shown a discount and charged the full amount: the addon
  // did not apply. That is a real overcharge against a promise the UI made.
  assert.match(verifyRoute, /purchase\.couponCode && Number\(payment\.amount\) === purchase\.originalAmountPaise/);
  assert.match(verifyRoute, /coupon addon did not apply/);
});

test("every path that ends a checkout also frees the code", () => {
  // Abandoned: only the SUBSCRIPTION reconciler sees these rows —
  // purchase-reconciliation filters kind != subscription and never reaches them.
  assert.match(reconciliation, /releaseCoupon\(/);
  assert.match(reconciliation, /abandoned_subscription_checkout/);

  // Superseded by the customer's own retry.
  assert.match(createRoute, /superseded_pending_subscription/);

  // Paid: reserved -> redeemed, from both the client confirmation and the
  // webhook, because either can arrive first.
  assert.match(verifyRoute, /redeemCoupon\(/);
  assert.match(webhooks, /redeemCoupon\(/);
});

test("release only ever touches a reserved row", () => {
  // A redeemed row represents money that actually moved. Unwinding it belongs
  // to refund handling, which also has to decide about the credits.
  const releaseBody = couponLib.slice(
    couponLib.indexOf("export async function releaseCoupon"),
    couponLib.indexOf("/** Records which provider subscription"),
  );
  assert.match(releaseBody, /status: "reserved"/);
  assert.doesNotMatch(releaseBody, /status: \{ \$in: \["reserved", "redeemed"\] \}/);
});

test("a retry reuses the customer's own reservation instead of rejecting it", () => {
  // A declined card is routine and the customer is told to retry. If their own
  // reserved row produced a 409, one declined card would lock them out of the
  // code permanently.
  const reserveBody = couponLib.slice(
    couponLib.indexOf("export async function reserveCoupon"),
    couponLib.indexOf("/** reserved -> redeemed"),
  );
  assert.match(reserveBody, /reused: true/);
  assert.match(
    reserveBody,
    /String\(mine\.coupon\) === String\(options\.couponId\)/,
    "the reservation must be matched to this coupon and purchase before being reused",
  );
  // A released row is re-reserved rather than left behind, or the retry would
  // proceed with no live claim at all.
  assert.match(reserveBody, /mine\.status === "released"/);
});

test("the global cap counts live claims only", () => {
  // Counting released rows would let abandoned checkouts permanently drain the
  // supply of a limited code.
  const resolveBody = couponLib.slice(
    couponLib.indexOf("export async function resolveCoupon"),
    couponLib.indexOf("export type ReserveResult"),
  );
  assert.match(resolveBody, /status: \{ \$in: \["reserved", "redeemed"\] \}/);
});

test("the addon carries the upfront and the plan keeps the full price", () => {
  // This is the whole mechanism: discounting the plan would proliferate a plan
  // per discount and break the plan cache key.
  assert.match(createRoute, /amount: couponResolution\.quote\.upfrontAmountPaise/);
  assert.match(createRoute, /startAt: couponResolution\?\.ok/);
  assert.doesNotMatch(
    createRoute,
    /createRazorpayPlan\([^)]*upfront/s,
    "the plan must never be created at a discounted amount",
  );
});

test("the client never guesses the discount", () => {
  // The checkout quote guard compares the client's figure against the server's
  // own upfront. Any locally-derived number 409s on every attempt — which is
  // exactly what happened: the quote was read from state written only BY a
  // successful response, so the first submit always sent the list price and no
  // coupon checkout could ever succeed.
  assert.doesNotMatch(client, /COUPON_PERCENTS/, "no hardcoded percent table may remain");
  assert.match(client, /api\/billing\/coupons\/preview/, "the quote must come from the server");
  assert.match(
    client,
    /quotedAmountSubunits: appliedQuote\?\.upfrontSubunits/,
    "the quote must be the one passed in, not read back from state",
  );
});

test("a reserved claim does not lock the customer out of their own retry", () => {
  // A declined card is routine and the customer is told to retry. Rejecting on
  // a reserved row made reserveCoupon's reuse branch unreachable and turned one
  // declined card into a lockout lasting until a reconciler sweep.
  const resolveBody = couponLib.slice(
    couponLib.indexOf("export async function resolveCoupon"),
    couponLib.indexOf("export type ReserveResult"),
  );
  assert.match(resolveBody, /status: "redeemed"/, "only a spent code blocks a new attempt");
  assert.doesNotMatch(
    resolveBody,
    /user: options\.userId,\s*\n\s*status: \{ \$in: \["reserved", "redeemed"\] \}/,
    "a reserved row must not be treated as proof the code was used",
  );
});

test("the reuse branch matches the coupon in both directions", () => {
  // Short-circuiting when no coupon was requested handed a pending subscription
  // that CARRIED a discount addon back to a full-price request: the page showed
  // the list price and Razorpay charged the discounted upfront. An undercharge,
  // invisible to the plan-identity check because the plan genuinely is full price.
  assert.match(createRoute, /existingSubscriptionCouponCode/);
  assert.match(
    createRoute,
    /existingSubscriptionCouponCode ===\s*\(couponResolution\?\.ok \? couponResolution\.quote\.code : null\)/,
    "presence and absence of a coupon must both have to match",
  );
});

test("scheduled is a live subscription everywhere it is read", () => {
  // The reconciler writes "scheduled", and findOneAndUpdate runs without
  // runValidators — so its absence from the enum was silent, and a paying
  // customer showed as Free/Inactive for their entire first cycle.
  assert.match(userBilling, /"scheduled"/, "the enum must contain the status that gets written");
  assert.match(catalogLib, /status === "scheduled"/, "an authorised mandate is an active subscription");
  assert.match(
    createRoute,
    /\["active", "cancel_scheduled", "scheduled"\]/,
    "a live scheduled subscription must block a second checkout, or the slot E11000s after a payable subscription exists",
  );
});

test("a reservation cannot be stranded by a failure after the provider call", () => {
  // Until the reservation knows its subscription id, neither release filter can
  // find it. Attaching before the local writes, and wrapping those writes,
  // closes the window that made the claim unrecoverable.
  const attachAt = createRoute.indexOf("attachSubscriptionToRedemption");
  const purchaseSaveAt = createRoute.indexOf("purchase.razorpaySubscriptionId = subscription.id");
  assert.ok(attachAt > 0 && purchaseSaveAt > 0);
  assert.ok(attachAt < purchaseSaveAt, "attach must precede any local write that can throw");
  assert.match(createRoute, /local_subscription_write_failed/);

  // And a backstop for the endings that conclude no flow at all.
  assert.match(couponLib, /export async function sweepOrphanedReservations/);
  assert.match(read("app/api/cron/n4-product-recall/route.ts"), /sweepOrphanedReservations/);
});

test("every ending of a checkout frees the claim", () => {
  // Each of these leaves the subscription in a state the reconciler does not
  // scan, so without an explicit release the code is blocked forever.
  assert.match(cancelRoute, /releaseCoupon\(/, "user cancellation");
  assert.match(webhooks, /subscription_\$\{eventType\.split\(/, "halted and cancelled webhooks");
});

test("a paid mandate is never reclaimed blind", () => {
  // A discounted subscription rests in `authenticated` with a future charge_at
  // for its whole first cycle, and its addon may already be captured. Reclaiming
  // without asking the provider both cancels a paid subscription and returns a
  // spent code to the pool.
  const reclaimAt = createRoute.indexOf("staleIsLivePaidMandate");
  const releaseAt = createRoute.indexOf("superseded_pending_subscription");
  assert.ok(reclaimAt > 0 && reclaimAt < releaseAt, "verify with the provider before releasing");
  assert.match(createRoute, /staleIsLivePaidMandate = true/, "an unreachable provider must not authorise destruction");
});

test("a successful signup does not release the claim", () => {
  // subscription.authenticated IS the success event for a coupon subscription -
  // it is future-dated, so it rests in authenticated for its whole first cycle.
  // The release lives in a case block shared with authenticated, activated and
  // pending, so it must be gated on the event, not on reaching the block.
  // Ungated, a paid customer's claim went back to the pool: the per-user cap
  // became void and the discount became repeatable indefinitely.
  assert.match(
    webhooks,
    /eventType === "subscription\.halted" \|\| eventType === "subscription\.cancelled"/,
    "release must fire only for the two endings, never for authenticated",
  );
  const block = webhooks.slice(
    webhooks.indexOf('case "subscription.authenticated":'),
    webhooks.indexOf('case "subscription.charged"'),
  );
  const gateAt = block.indexOf('eventType === "subscription.halted"');
  const releaseAt = block.indexOf("releaseCoupon(");
  assert.ok(gateAt > 0 && gateAt < releaseAt, "the gate must precede the release");
});

test("the backstop can see a discounted subscription at all", () => {
  // A coupon subscription is created payment_pending and promoted to scheduled,
  // and rests there for its ENTIRE first cycle. Scanning only
  // active/cancel_scheduled meant the one path that recovers a payment the
  // webhook never delivered could not see it: money taken, no credits, no
  // settlement, no alert.
  assert.match(
    cycleReconciler,
    /\["active", "cancel_scheduled", "scheduled", "payment_pending"\]/,
    "the cycle backstop must scan the statuses a discounted subscription rests in",
  );
});

test("a correctly fulfilled subscription sale does not look unfulfilled", () => {
  // findPaidButUnfulfilledPurchases defines "customer paid and got nothing" as
  // {captured, grantApplied:false}, and the daily cron 500s when that list is
  // non-empty. Subscription credits come from the cycle path, which never
  // touches the purchase row - so without this every correct sale turned the
  // billing cron permanently red.
  assert.match(alerts, /grantApplied: false/, "the alert's definition is unchanged");
  assert.match(
    verifyRoute,
    /\{ _id: purchase\._id, grantApplied: false \},\s*\n\s*\{ \$set: \{ grantApplied: true \} \}/,
    "verify must record that the grant was delivered",
  );
});

test("a payment the webhook never delivered is settled, without granting again", () => {
  // Nothing settled a subscription purchase when its webhook failed:
  // purchase-reconciliation excludes kind "subscription" and the subscription
  // reconciler only marks them failed. The first paying customer's row sat
  // pending for eight days with a real payment against it.
  assert.match(cycleReconciler, /settlePaidSubscriptionPurchases/);
  const helper = cycleReconciler.slice(
    cycleReconciler.indexOf("async function settlePaidSubscriptionPurchases"),
    cycleReconciler.indexOf("export async function reconcileSubscriptionCycles"),
  );
  assert.match(helper, /grantApplied: true/, "settling must close the door on a second grant");
  assert.match(
    helper,
    /status: \{ \$in: \["pending", "created"\] \}/,
    "a webhook arriving mid-run must win, and a refunded row must never be resurrected",
  );
});

test("the only code an arbitrary account can take is capped", () => {
  // WELCOME15 has no balance requirement and is the placeholder on the billing
  // page. Uncapped, the seed run itself would be the decision to give an
  // unbounded number of people 15% off.
  const seed = read("scripts/seed-coupons.ts");
  const welcome = seed.slice(seed.indexOf('code: "WELCOME15"'), seed.indexOf('code: "BOOST20"'));
  assert.doesNotMatch(welcome, /maxRedemptions: null/, "WELCOME15 must not seed uncapped");
  assert.match(welcome, /maxRedemptions: \d+/);
});
