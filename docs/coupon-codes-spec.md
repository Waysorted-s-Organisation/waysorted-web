# Coupon codes — implementation spec

Status: **spec, nothing built.** Written against `main` @ `29ac9ed`.
The mechanism was verified against the live Razorpay API in test mode — 48/48 combinations
(6 products × INR/USD × 4 coupons), zero failures.

---

## 1. The mechanism

Create the subscription on the **full-price plan**, with `start_at` one cycle in the future and an
`addons` entry equal to the **discounted first cycle**.

```jsonc
POST /v1/subscriptions
{
  "plan_id":  "<FULL price plan>",   // never discounted
  "start_at": <now + 1 cycle>,        // plan first charges here, at full price
  "addons": [{ "item": {
      "name":     "First month — BOOST20",
      "amount":   27920,              // ₹279.20 — the discounted first cycle
      "currency": "INR"
  }}]
}
```

Razorpay raises an **authorisation invoice for the addon amount** and its checkout renders:

```
UPFRONT AMOUNT    ₹279.20   One time payable
RECURRING AMOUNT  ₹349.00   Billed for this month
```

with the copy *"a payment of ₹279.20 will be charged now. Waysorted will then charge ₹349 every
month."* One sheet.

**The discount is never refunded.** Razorpay: *"Upfront amount and subsequent charges are
auto-captured."* Only the separate ₹5 card-validation token is auto-refunded, which already happens
on every subscription today.

**Why this beats every alternative:** the plan stays full-price, so the plan cache key
`${currency}:${amountPaise}:${tier}` (`subscriptions/create:238`) is untouched and no plan
proliferates per discount. Offers are INR-only; plan-swap is blocked for UPI, eMandate and domestic
cards; charge-at-will is INR-only. This works in every currency and every payment method.

---

## 2. Fix this first, or nothing else matters

`lib/billing/webhooks.ts:40`

```ts
if (eventType === "subscription.authenticated") return "payment_pending";
```

`lib/billing/subscription-reconciliation.ts:29-31` then scans `status: "payment_pending"` older than
2 hours and **cancels the provider subscription**.

A future-dated subscription sits in `authenticated` for the whole first cycle. So as the code stands,
**every discounted subscription would be cancelled two hours after signup.**

Add a local status (e.g. `scheduled`) for an authenticated subscription whose `charge_at` is in the
future, and exclude it from the reconciler sweep. Do **not** simply widen the reconciler's age cutoff
— that would stop it catching genuinely abandoned checkouts, which is the job it exists to do.

Ship and verify this **alone**, before any coupon exists.

---

## 3. Data model

**`models/coupon.ts`** — `code` (unique, uppercase), `percent`, `appliesToProductCodes`,
`maxRedemptions`, `maxPerUser`, `validFrom` / `validUntil`, `active`.

No Razorpay Offer ids — we never create Offers. The discount is an amount we compute.

**`models/couponRedemption.ts`** — `coupon`, `user`, `purchase`, `subscriptionId`, `code`,
`discountPaise`, `currency`, `status: reserved | redeemed | released`, timestamps.

Indexes, which carry the money safety:
- `unique(purchase)` — one purchase can never redeem twice
- `unique(coupon, user)` **partial on `status: {$in:["reserved","redeemed"]}`**

A partial unique index can only express `maxPerUser = 1`. Fix it at 1 and document that, or count
inside `runBillingTransaction` — do not pretend the index enforces an arbitrary N.

**Ship a migration for both indexes.** An idempotency guard depending on an unmigrated index is
exactly how the double-credit stayed invisible; `scripts/migrate-billing-idempotency-indexes.ts` is
the pattern.

**`models/purchase.ts`** — add `originalAmountPaise`, `discountPaise`, `couponCode`.
`amountPaise` holds the **amount actually charged at signup** (the upfront), so
`subscriptions/verify` keeps comparing against the right number.

---

## 4. Code changes

### 4.1 `lib/billing/razorpay.ts:164`

`createRazorpaySubscription` sends only `plan_id`, `total_count`, `customer_notify`, `quantity`,
`notes`. Add optional `startAt` and `addons`, passed through as `start_at` and `addons`.

### 4.2 `app/api/billing/subscriptions/create/route.ts`

Coupon resolution must happen **before** the pending-subscription reuse branch at `:169`.

1. Validate: active, in window, product in `appliesToProductCodes`, global cap, per-user.
2. **Make the reuse branch coupon-aware.** It returns an existing subscription created *without* an
   addon. Reusing it for a coupon request charges full price while the UI promised a discount — and
   `verify` would agree, because the purchase row would also be full price. If a coupon is requested
   and the existing subscription has no matching addon, fall through and reclaim.
3. `discountPaise = Math.round(full * percent / 100)`, `upfront = full - discountPaise`.
   **Round, never floor** — flooring undercharges. Assert `upfront >= minimumChargeSubunits(currency)`
   and `>= 100` (`models/purchase.ts:57` enforces `min: 100`).
4. Quote guard compares against **upfront**; the client sends the discounted quote.
5. `createPurchaseRecord` with `amountPaise = upfront` plus the three new fields.
6. Reserve the `CouponRedemption` **before** the provider call. On E11000 distinguish by index name:
   `unique(purchase)` is a benign retry (reuse it); only `unique(coupon,user)` is `coupon_invalid`.
7. Create the subscription with `startAt` and the addon.

**Retry must be idempotent, not rejected.** A declined card is routine and
`billing-client.tsx:568` tells the customer to retry. If they hit their own `reserved` row and get a
409, one declined card locks them out of the code forever. Check whether the reservation belongs to
*this* user and *this* purchase, and reuse it.

**Coupon must be part of checkout identity.** `:264` reuses a Purchase by idempotency key, skipping
`createPurchaseRecord` — so a coupon applied on a retry would never write the discount fields, and
Razorpay would charge the upfront against a full-price purchase row. Fold `couponCode` into the
idempotency key, and clear the cached attempt key in `billing-client.tsx` `ondismiss` (`:516`) so an
abandoned attempt cannot bind the next one.

### 4.3 `app/api/billing/subscriptions/verify/route.ts:73-75`

The first payment is the **upfront**, not the plan amount. Because `amountPaise` stores the upfront
(§3), the existing exact-equality check stays correct with no edit.

Add one guard: if `purchase.couponCode` is set and `payment.amount === purchase.originalAmountPaise`,
the addon did **not** apply — the customer paid full price after being shown a discount. Log loudly
and reconcile; never silently accept.

### 4.4 Credits

First cycle is granted as today via `applySubscriptionCycleCredits` with
`buildSubscriptionCycleKey(subscriptionId, paymentId)`. Cycle 2+ comes from `subscription.charged`
and the renewal backstop. Because `start_at` is one full cycle out, Razorpay's first plan charge *is*
your cycle 2 — the two never overlap.

**Credits do not scale with price.** `applySubscriptionCycleCredits` grants from the catalog
(`db.ts:889`), so `UNLOCK30` delivers full credits at 70% of the price for cycle 1. Intended, but
decide it deliberately.

### 4.5 Redemption lifecycle

| Event | Transition | Location |
|---|---|---|
| Subscription created | → `reserved` | `subscriptions/create` |
| Verified / `subscription.charged` | `reserved → redeemed` | `subscriptions/verify`, `webhooks.ts` |
| Abandoned | `reserved → released` | **`subscription-reconciliation.ts`** — *not* `purchase-reconciliation.ts`, which filters `kind != subscription` (`:28`) and never sees these |
| Superseded on retry | `reserved → released` | the reclaim at `subscriptions/create:196` |
| Refunded (full, first cycle) | `redeemed → released` | refund handling |
| Orphaned reservation | → `released` | standalone sweeper |

Without the release path, one abandoned checkout permanently consumes a `maxPerUser: 1` code for a
customer who paid nothing.

### 4.6 Client

`billing-client.tsx` — send `couponCode` with the existing quote fields, and set
`quotedAmountSubunits` to the **upfront**. Handle `coupon_invalid` distinctly from
`pricing_quote_changed`.

Show both numbers before checkout: *"₹279.20 for your first month, then ₹349/month."* Razorpay's
sheet repeats it, so the customer sees it twice.

### 4.7 Eligibility

Nothing binds `UNLOCK30` to actually having 0 credits. The codes are static and will circulate.
Either check the wallet balance server-side at redemption, or accept publicly that they are open
promo codes and set `maxRedemptions` accordingly.

---

## 5. Scope

Monthly **and** yearly both verified. But *"15% off your first month"* on `sub_year_7499` is 15% off
a whole year — ₹1,125. Either restrict `appliesToProductCodes` to the three monthly plans, or change
the copy for yearly.

---

## 6. Tests

- Discount arithmetic: rounding direction, minimum-charge floor, `min: 100`, 100% rejected.
- Upfront equals the client quote — the check that stops every coupon checkout 409ing.
- Redemption state machine, including reserve → release → re-reserve after a declined card.
- Reuse-branch coupon awareness: an addon-less subscription is not reused for a coupon request.
- **Reconciler exclusion: a future-dated subscription is not cancelled at 2h.** The one that breaks
  everything.
- `npm run harness:coupons` against test mode before each release.

---

## 7. Rollout

1. **Reconciler fix + `scheduled` status (§2). Ship and verify alone.**
2. Models + migration + discount helper + tests. Nothing user-visible.
3. `startAt` / `addons` on the Razorpay helper.
4. `subscriptions/create` wiring, including the reuse branch and idempotency key.
5. Redemption lifecycle and release paths.
6. Client and modal.
7. Enable **one** code for a small audience. Verify a real discounted subscription reaches
   `status: "captured"` with the correct `razorpayPaymentId`, **then** enable the rest.

Step 7 is not ceremony: no purchase in production has ever reached `captured`. The first coupon
subscription is also the first real end-to-end test of the repaired verify path.

---

## 8. Still unobserved

A real cycle-2 debit. Razorpay's minimum interval is 7 days, so it needs calendar time. `charge_at`
and the checkout copy both state the full amount, but neither is a debit. Verify on the first real
renewal before scaling the codes.
