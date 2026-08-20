> **SUPERSEDED — do not implement from this document.**
>
> This plan selects Mechanism C (full price plus bonus credits) and at the time
> explicitly rejected `start_at` + addons, on the grounds that it "would collide
> head-on with `subscription-reconciliation.ts`". That collision was real, and
> it has since been fixed: an authorised mandate with a future `charge_at` is
> promoted to a `scheduled` status the reconciler leaves alone.
>
> With that resolved, the addon mechanism was verified against the live Razorpay
> API in test mode across 48/48 combinations, and it is what is implemented. It
> keeps the plan at full price — so the plan cache key never changes and no plan
> proliferates per discount — and it works in every currency and payment method,
> which Offers and plan-swap do not.
>
> The implemented design is `docs/coupon-codes-spec.md`. This file is retained
> for the alternatives it evaluates and the reasoning behind each rejection.

# FINAL PLAN — Coupon codes on subscriptions, live Razorpay stack

Every repo fact below was re-verified against working tree `main` @ `b61a8a5`. Every Razorpay claim in §3 was re-fetched from the cited URL during this analysis. Where I could not verify, it is in the second list of §3 and nowhere else.

---

## 1. Decision

**Ship Mechanism C — full price charged, bonus credits granted — because it is the only mechanism that never writes a number into `purchase.amountPaise` that Razorpay might disagree with, and `app/api/billing/subscriptions/verify/route.ts:72-75` compares those two numbers with exact integer equality *after* the card is already captured.**

On a stack where **no purchase has ever reached `captured`**, the first coupon checkout is also the first real end-to-end exercise of the verify path. That test must be boring. Every discount mechanism makes it interesting.

The cost is real and is not an engineering cost: the copy changes from **"15% OFF your first month"** to **"+15% bonus credits on your first month."** If the founder rejects that, §2 gives the exact fallback and its exact price.

---

## 2. Why not the others

**A — Razorpay Offers (`offer_id` at subscription creation).** Disqualified as a complete answer by one confirmed sentence: *"We do not support offers on international currency and the CFB (Customer Fee Bearer) model."* That structurally excludes the one live USD subscriber (`sub_month_1`, USD 5.99, tier_1), the 24 US wallets and ~20 other non-INR countries. Within INR it is genuinely buildable — `offer_id` is a documented Create Subscription parameter, Standard Checkout is already in use at `billing-client.tsx:157`/`:503`, and the "On Payment Failure → Do not allow the payment to go through" setting converts most mismatch classes into pre-capture declines rather than post-capture 409s. **What A buys you: a literal percentage discount, INR-only, monthly-only. What it costs: four hand-created, immutable, Dashboard-only offers (eight if the UPI/Card split is required, since subscription offers are UPI-only *or* Card-only and `offer_id` binds before the customer picks a method); a hard dependency on an undocumented rounding rule; and an unresolved question — Razorpay's own page says *"customers can select the offer when making the payment"* — about whether a customer who simply doesn't tap the offer tile is charged full price against a discounted purchase row.** That last one is behaviour-driven, not bug-driven, and it lands on `verify:72-75` after capture.

**B — Plan swap to full price at `cycle_end`.** Dead. *"For Subscriptions created using domestic cards, you can update only the offer that is linked to them"* — plan is not updatable for the largest cohort. Separately, *"You can only update Subscriptions in the `authenticated` and `active` states"*, so the swap cannot be issued at checkout at all; it must be a deferred job fired from a webhook. And UPI/eMandate subscriptions cannot be updated at all. When the swap does not run, **nothing errors and the customer renews at the discounted price forever** — nothing in this repo compares a subscription's provider `plan_id` to the catalog, so drift is undetectable. Worst available failure mode: silent, permanent, invisible.

**D — Permanently discounted plan.** Technically the only price-changing mechanism with a deterministic charged amount (we author `item.amount` ourselves, so `verify:72-75` holds exactly). Rejected on product grounds: the discount never ends, which contradicts "first month" outright, and `applySubscriptionCycleCredits` (`lib/billing/db.ts:875`) grants **100% of catalog credits regardless of amount paid** — so a 30% redeemer gets full credits at 70% price every month forever. A leaked static code becomes an unbounded recurring liability.

**E — Hybrid.** Not merely worse — **not implementable**. The routing key is payment method, and the server creates the provider subscription at `create/route.ts:281` *before* `billing-client.tsx:503` hands `subscription_id` to the sheet where the customer picks card vs UPI. There is no point in the flow where the branch can be evaluated. Worse, A fails internationally and B fails domestically — complementary populations, so the hybrid inherits both failure modes instead of covering the gap.

**F — addons / `start_at` / quantity / order-then-subscription / payment links.** `addons` is *"any upfront amount you want to collect as part of the authorisation transaction"* — additive only. `quantity` is an integer multiplier. `start_at` expresses free *time*, not a percentage, and would collide head-on with `subscription-reconciliation.ts` (`DEFAULT_MINIMUM_AGE_MS = 2h`), which cancels provider subscriptions in `created`/`pending`/`authenticated` with no confirmed purchase. Order-then-subscription means two mandates, two charges, and a brand-new orphan class (paid, no subscription). Payment links carry no recurring mandate.

---

## 3. CONFIRMED vs MUST ASK RAZORPAY

### CONFIRMED — documentation citation, re-fetched during this analysis

| Fact | Source |
|---|---|
| *"We do not support offers on international currency and the CFB (Customer Fee Bearer) model."* | [docs/payments/offers](https://razorpay.com/docs/payments/offers/) |
| *"For Subscriptions created using domestic cards, you can update only the offer that is linked to them."* | [docs/payments/subscriptions/update](https://razorpay.com/docs/payments/subscriptions/update/) |
| *"You can only update Subscriptions in the `authenticated` and `active` states. Subscriptions in the `created`, `pending` or `halted` state cannot be updated."* | same |
| *"You can only update the offer linked to the Subscription at the end of the cycle. It is not possible to update an offer linked to a Subscription immediately."* | same |
| Update Subscription API returns explicit 400s for UPI payment mode and for emandate payment mode | [api/…/update-subscription](https://razorpay.com/docs/api/payments/subscriptions/update-subscription/) |
| *"You can create offers only from the Dashboard."* Subscription offers are **UPI-only or Card-only** — no unrestricted option. Redemption types are Single Use / Limited number of cycles / Forever. An **"On Payment Failure"** setting exists with exactly two options: *"Allow the customer to complete the payment without the offer"* / *"Do not allow the payment to go through."* | [subscriptions/offers/create](https://razorpay.com/docs/payments/subscriptions/offers/create/) |
| *"After you create a Subscription with an Offer, customers can select the offer when making the payment, and it is applied immediately."* and *"Offers can only be applied if the chargeable amount after applying the Offer is greater than ₹1."* | [subscriptions/offers](https://razorpay.com/docs/payments/subscriptions/offers/) |
| *"You cannot edit an offer once you create it. To make changes, disable the previous offer and create a new one."* | [offers/faqs](https://razorpay.com/docs/payments/offers/faqs/) |

**Confirmed in the repo (line-verified, not inherited):**
- `verify/route.ts:72-75` — exact `Number(payment.amount) !== purchase.amountPaise` **fused with a currency check**, and a *third* conflict at `:76-81` comparing `providerSubscription.notes.productCode` to `purchase.productCode`. **The plan doc's `verify:71` is wrong; line 71 is the closing brace of the captured-status check.**
- `verify/route.ts:111` hardcodes `` `${subscriptionId}:payment:${paymentId}` `` instead of importing `buildSubscriptionCycleKey` (`lib/billing/webhook-payload.ts:63-65`). Identical string today, one edit from divergence.
- `applySubscriptionCycleCredits` (`db.ts:875-949`) derives the grant entirely from `getCatalogProduct(subscription.planCode)`: `product.creditsGranted + product.bonusCredits`. **No amount is an input.** Its `catch { if (code===11000) return existingSubscription }` at ~907 returns *inside* `session.withTransaction`.
- Exactly **three** grant call sites: `verify/route.ts:109`, `webhooks.ts:304`, `subscription-cycle-reconciliation.ts:132`.
- `create/route.ts:157-167` — the reuse identity check tolerates `amountSubunits === undefined || === null`, so a legacy row matches **at any price**. `:169-190` returns the existing subscription. `:238` plan cache key `${currency}:${amountPaise}:${tier}`. `:264` reuses a Purchase by idempotency key, skipping `createPurchaseRecord`.
- `billing-client.tsx:516-520` (ondismiss) **and** `:568-573` (payment.failed) both retain the attempt key; `:360/:416/:442/:485/:541/:577` clear it. Retention on `payment.failed` looks deliberate — it makes retry idempotent against the same Purchase.
- `recordRefundAdjustment` (`db.ts:1570`) computes clawback from `purchase.creditsGranted + purchase.bonusCredits` scaled by `cumulativeRefundAmount / purchase.amountPaise` (`db.ts:1584-1593`). **A separately-keyed bonus is NOT clawed back.**
- `applyPurchaseCredits` (`db.ts:673, 722`) reads `purchase.bonusCredits` and writes key `purchase-bonus:${_id}`. It is called unconditionally at `webhooks.ts:192` with **no `kind` filter** — currently unreachable for subscriptions only because the lookup keys on `razorpayOrderId`/`receipt`, which subscription checkout never sets. **This is a lookup accident, not a structural guarantee.**
- `purchase-reconciliation.ts:28` filters `kind: { $ne: "subscription" }`. `subscription-reconciliation.ts:8` = 2h. `vercel.json` schedules exactly one cron, `0 4 * * *`.
- `models/creditLedger.ts` already contains `"bonus_grant"` in the reason enum. `idempotencyKey` is declared `unique: true` in the schema.
- `models/subscription.ts:79-85` — unique partial index over status ∈ `[payment_pending, active, cancel_scheduled, halted]`.
- `history/route.ts:26` — renewals query is `idempotencyKey: { $regex: /^subscription-cycle:/ }`.
- Catalog monthly credits: `sub_month_1`=150, `sub_month_2`=550, `sub_month_3`=1500. Yearly: 2400/6000/14400. **`sub_year_1599` has `priceInr: 1499`** — the code name lies; do not build any table from code names.

### MUST ASK RAZORPAY — no citation found, do not treat as known

These only matter if the founder overrides §1 and takes Mechanism A. **None of them gate Mechanism C.**

1. Does passing `offer_id` on a **non-INR** plan return a hard 400, or silently accept and charge full price? The distinction decides between a branchable error and a post-capture 409.
2. Is a subscription-linked offer **auto-applied**, or must the customer actively select it in the sheet — and can they decline it and still pay full price? Does the "On Payment Failure → Do not allow the payment to go through" setting cover a *decline*, or only a *validation failure*?
3. Exact rounding rule for a percentage offer — floor, round-half-up, or ceil, and applied to the discount or the net? Work USD 599: is 15% → 509 or 510?
4. Does `Limited number of cycles = 1` mean the **first** cycle, and is the **authorisation transaction** counted as cycle 1? (Settle empirically in test mode; do not wait on support.)
5. With "Show Offer on Checkout" **disabled**, is a linked offer still applied? We need it applied but not advertised, or all four codes become self-serve discounts to ungated users.
6. Is there any global Max Usage on *subscription* offers (documented only on the general offers page), and does exhausting it fail creation or silently charge full price? Is remaining usage readable via API?
7. Can an offer's redemption/cycle configuration be **read back** via API after creation? If not, "cycles = 1 vs Forever" is a Dashboard field with no programmatic assertion — a human typo silently converts A into D.
8. **Mechanism-independent and the most important unknown on this list:** what amount is charged in the **authentication transaction** for card vs UPI AutoPay vs eMandate, and does `payment.amount` for that transaction always equal `plan.amount × quantity`? `verify:72-75` inspects *that* payment, not a steady-state renewal. If a token-amount mandate is ever used, `verify` 409s after capture **under every mechanism including C**.

---

## 4. End-to-end implementation

Design principle: **the coupon never touches an amount, a plan, a provider call, or a comparison.** It is a field on the Purchase and a ledger row granted alongside the first cycle's credits.

### Step 0 (PREREQUISITE, separate PR, ship and soak first)

Harden the cycle-key dedupe in `applySubscriptionCycleCredits` (`db.ts:875`). `webhook-payload.ts:33-41` falls back to `invoice:` / `period:` / `paid-count:` shapes when no `payment_id` is present, while `verify/route.ts:111` always writes `payment:`. `applySubscriptionCycleCredits` dedupes **only** by catching E11000 on the exact key string — it stores `paymentId` in metadata but never probes on it. Only `subscription-cycle-reconciliation.ts:100-116` has been hardened. Move that probe (`$or: [{idempotencyKey: {$in: candidates}}, {"metadata.paymentId": paymentId}]`) **into** `applySubscriptionCycleCredits` so all three callers inherit it.

*Skip this and:* the pre-existing double-credit hole that already hit the first paying customer stays open, and the coupon feature will be blamed for the next occurrence.

Also in this PR (zero-behaviour refactor): replace the hardcoded string at `verify/route.ts:111` with `buildSubscriptionCycleKey(subscriptionId, paymentId)`.

### Step 1 — Coupon catalog as code, not data

New `lib/billing/coupons.ts`:

```ts
export const COUPONS = {
  WELCOME15: { pct: 15, maxBalance: 75 },
  BOOST20:   { pct: 20, maxBalance: 50 },
  TOPUP25:   { pct: 25, maxBalance: 25 },
  UNLOCK30:  { pct: 30, maxBalance: 0  },
} as const;
```

Static TS constant, reviewed in git, no DB read on the money path, no admin surface to abuse. Bonus is `Math.floor(product.creditsGranted * pct / 100)` — an integer, derived from the catalog, **independent of currency, FX, tier and rounding**. Eligibility requires `product.kind === "subscription" && product.billingCycle === "monthly"`.

Concrete grants:

| | `sub_month_1` (150) | `sub_month_2` (550) | `sub_month_3` (1500) |
|---|---|---|---|
| WELCOME15 | +22 | +82 | +225 |
| BOOST20 | +30 | +110 | +300 |
| TOPUP25 | +37 | +137 | +375 |
| UNLOCK30 | +45 | +165 | +450 |

**Be honest with the founder about value:** a `+b%` credit bonus is worth an effective discount of `1 − 1/(1+b)`, not `b`. +15%→13.0%, +20%→16.7%, +25%→20.0%, +30%→23.1%. To value-match a `d%` discount you need `b = d/(1−d)` (+17.6/+25/+33.3/+42.9%). **Ship the nominal percentages** — they are simpler, cheaper, and honest so long as the copy says "+15% bonus credits" and never "worth 15% off."

Gate everything behind `COUPONS_ENABLED` and a per-code allowlist env var. **This is the kill switch — no deploy required to disable.**

*Skip the monthly guard and:* 30% on `sub_year_7499` at tier_1 gives away ~4,320 credits against copy promising a month.

### Step 2 — Data model (additive only)

`models/purchase.ts` — three **new** fields, defaults, no index changes:
```ts
couponCode: { type: String, default: null },
couponBonusCredits: { type: Number, default: 0, min: 0 },
couponBonusApplied: { type: Boolean, default: false },
```
**Do NOT reuse `purchase.bonusCredits`.** `applyPurchaseCredits` (`db.ts:673`) reads it under a disjoint idempotency key `purchase-bonus:${_id}` and is called with no `kind` filter at `webhooks.ts:192`. Writing there creates a second, independent grant path — the exact double-credit class this repo has already been burned by.

New `models/couponRedemption.ts`:
```ts
{ user, code, purchase, subscription, bonusCredits, status: "attached"|"granted", grantedAt }
```
Indexes:
- `{ purchase: 1 }` unique
- **`{ user: 1 }` unique, partialFilterExpression `{ status: "granted" }`** ← this is the one-promotional-bonus-per-user-ever rule, **across all four codes**
- `{ code: 1, status: 1 }` for the global cap count

The plan doc's proposed `unique(coupon, user)` is a defect: it is scoped per code, so a serial churner collects 30%, then 25%, then 20%, then 15%.

*Skip the user-scoped unique index and:* four bonuses per account instead of one.

**There is no reserved state and no release lifecycle.** `attached` rows are inert; only `granted` is capped. Abandoned attachments cost nothing and need no sweeper. This is the single largest reason C is cheaper than A — it deletes the entire reserve/abandon/decline/supersede/orphan machinery the plan doc §4.4 proposes, plus its sweeper on a 24h cron against a 2h abandonment window.

### Step 3 — Validate endpoint

`POST /api/billing/coupons/validate` → `{ code, productCode }` → returns `{ valid, bonusCredits, reason? }`.

Checks: coupon exists and is enabled; product is a monthly subscription; `snapshot.availableCredits <= COUPONS[code].maxBalance`; no `CouponRedemption` with `{ user, status: "granted" }`; global count under cap.

**Eligibility is a ceiling, not a band — and ceilings nest.** `≤0` is a strict subset of `≤75`, so at zero credits all four codes validate and the user takes UNLOCK30. That is deliberate. Bands would preserve tiering but would reject a code we displayed 20 minutes ago when the balance moved, and the tiering loss is bounded to the delta between +15% and +30% of credits **on one subscription per user, ever** — COGS only. Not worth the complexity.

> **Product note, unsolicited but load-bearing:** the ladder pays users to run to zero. Waiting from 75 credits to 0 is worth the full 15-point spread at zero cost, and the weakest offer fires at the lowest-intent moment (75/100 credits, a quarter through the signup grant) while the strongest fires at the only high-intent moment (blocked at zero). Budget for a flat ~30%. If the ladder is a product requirement, **invert it** so the best offer rewards acting early.

### Step 4 — Attach at checkout (`app/api/billing/subscriptions/create/route.ts`)

Accept optional `couponCode` in the body. Resolve and validate it server-side (**never trust a client-supplied bonus number**). Then attach in exactly two places, both *after* all existing logic, both wrapped in try/catch that logs and never blocks:

1. **New-subscription path** — set `couponCode` / `couponBonusCredits` on the `purchase` object before the existing `await purchase.save()` at **:297**, and upsert the `CouponRedemption` as `attached` after `ensureSubscriptionRecord` at **:299**.
2. **Reuse path (:169-190)** — after `findPurchaseBySubscriptionId` at **:179**, `$set` the coupon fields on the reused purchase **only if `purchase.couponCode` is currently null and `couponBonusApplied` is false**, then upsert the redemption. This also covers the `:264` idempotency-key reuse, since both converge on the same `$set`.

This is the whole answer to plan-doc defects §0.1/§0.2/§0.4. Under a discount mechanism those branches are money-critical and must be reworked; **under C they are a `$set` on a field nobody compares.**

*Skip the reuse-path attach and:* a customer who dismisses the sheet and retries pays full price and silently gets no bonus. Recoverable by a manual grant — not a stranded payment.

### Step 5 — Grant at capture (`lib/billing/db.ts`, new function)

```ts
applyCouponBonusForPurchase({ purchaseId })
```
Inside `runBillingTransaction`, in this exact order:

1. Reload purchase in session. Return early (no-op) unless `couponCode` set, `couponBonusCredits > 0`, `couponBonusApplied === false`.
2. `CouponRedemption.findOneAndUpdate({ purchase, status: "attached" }, { $set: { status: "granted", grantedAt } })`. Null → already granted, return no-op.
3. `Purchase.findOneAndUpdate({ _id, couponBonusApplied: false }, { $set: { couponBonusApplied: true } })`. Null → **throw** to abort.
4. `CreditLedger.create` with `idempotencyKey: \`coupon-bonus:${purchase._id}\``, `reason: "bonus_grant"`.
5. `UserBilling.$inc { availableCredits, lifetimeBonusCredits }`.
6. `updateLegacyUserCredits(...)`.
7. Backfill `balanceAfter` on the ledger row.

**Critical: never `return` after catching an E11000 inside this transaction.** Let duplicate-key errors throw out of `withTransaction` and catch them at the call site. Whether MongoDB leaves a transaction committable after a duplicate-key write error inside it is *not documented* and there is no test for it in this repo — `db.ts:908` currently returns-after-E11000 and I am deliberately not replicating that pattern. Throwing makes the question moot.

Steps 4-7 replicate the exact wallet sequence at `db.ts:923-948`. **Skip any of them and:** the ledger row exists but the credits are unspendable and invisible to the wallet.

### Step 6 — Wire the three grant paths

After each existing `applySubscriptionCycleCredits` call, look up the Purchase by `razorpaySubscriptionId` and call `applyCouponBonusForPurchase`, each in its own try/catch that logs and never fails the caller:

- `app/api/billing/subscriptions/verify/route.ts:109` (inside the existing try block, after `creditsApplied = true`)
- `lib/billing/webhooks.ts:304`
- `lib/billing/subscription-cycle-reconciliation.ts:132`

**First-cycle-only is automatic and needs no cycle ordinal:** the subscription Purchase is created exactly once at checkout, the redemption row is unique per purchase, and `couponBonusApplied` latches. Renewals find `couponBonusApplied === true` and no-op.

**Do not gate on `purchase.status === "captured"`.** No production purchase has ever reached that state and `subscription.charged` (`webhooks.ts:268`) does not set it. Gating there would make the bonus almost never fire.

### Step 7 — Refund clawback (one line, money path)

`db.ts:1584`:
```diff
- const totalCredits = purchase.creditsGranted + purchase.bonusCredits;
+ const totalCredits = purchase.creditsGranted + purchase.bonusCredits
+   + (purchase.couponBonusApplied ? purchase.couponBonusCredits : 0);
```
*Skip it and:* a fully refunded first cycle returns 100% of the money while the customer keeps 100% of the coupon credits. Silent, unrecoverable without manual intervention, and it scales with every refunded redemption.

### Step 8 — Visibility

`app/api/billing/history/route.ts:26`: widen to `/^(subscription-cycle:|coupon-bonus:)/`.

*Skip it and:* the customer sees the cycle credits but not the bonus and concludes the code did not work — a support ticket per redemption.

### Step 9 — Provider setup

**None.** No offers, no plans, no Dashboard configuration, no `offer_id`, no test-vs-live parity problem, no immutable hand-created objects. `lib/billing/razorpay.ts` is not modified.

### Step 10 — Reconciliation

**No new job.** The existing daily cron (`vercel.json`, `0 4 * * *` → `subscription-cycle-reconciliation.ts:132`) already reaches every paid invoice, so wiring Step 6 there makes it the backstop for free. Add one line to `inspectCreditLedgerConsistency`: count purchases where `couponCode != null && couponBonusApplied === false && createdAt < now - 24h`, and report it. That number should be zero; if it is not, someone paid and did not get their bonus.

---

## 5. Gap analysis

| Scenario | What happens |
|---|---|
| **Happy path** | Full price charged. `verify:72-75` compares catalog price to catalog price — identical to today. Cycle credits grant, then coupon bonus grants in its own ledger row. |
| **Declined card** | No capture, no cycle grant, `applyCouponBonusForPurchase` never runs. Redemption stays `attached` — inert, not consumed. Customer retries and gets the bonus. **The code is not burned.** |
| **Dismissed sheet, then retry with a code** | `billing-client.tsx:516-520` retains the attempt key, so `create:264` returns the pre-existing Purchase. Step 4's reuse-path `$set` writes the coupon onto it. **Nothing is compared, nothing 409s.** Under any discount mechanism this branch charges one amount against a row holding another. |
| **Retry through the reuse branch (:169-190)** | Returns the existing offer-less subscription — which under C is *correct*, because there is no offer. Step 4 attaches the coupon to the reused purchase. |
| **Legacy row with `amountSubunits` null** | `create:157-167` matches it at any price and hands it back. Under C this is harmless (no amount was going to change). **Under B/D it silently reuses a subscription at the wrong amount and detonates at `verify:72-75`.** Worth fixing regardless — treat null as a mismatch — but it is not a coupon blocker. |
| **Lost `subscription.charged` webhook** | `verify/route.ts:109` already grants inline; the daily reconciler is the second backstop. Coupon bonus rides both. |
| **Duplicate webhook / both `invoice.paid` and `subscription.charged`** | Cycle grant deduped by the unique ledger index (hardened by Step 0). Coupon bonus deduped independently by `coupon-bonus:${purchase._id}` — **a key with no variable component**, so the key-drift that double-credited the first paying customer cannot recur. |
| **Refund (full or partial)** | Step 7 folds `couponBonusCredits` into the proportional clawback at `db.ts:1584`. Reached via `webhooks.ts:373` and `app/api/admin/billing/refunds/route.ts:55`. |
| **Cancellation** | Nothing to unwind — no discount, no plan swap, no scheduled call that can be lost. `webhooks.ts:209` continues to touch subscription state only. |
| **Cycle-2 renewal** | Charges exactly the same as cycle 1, because **no price ever changed**. `couponBonusApplied` is latched, so the bonus does not recur. This is the scenario that kills B and D and it is a no-op here. |
| **Coupon applied to an already-pending subscription** | Trivial: `$set` the fields on the existing Purchase. **Under A this is unrecoverable** — *"It is not possible to update an offer linked to a Subscription immediately"* — forcing cancel-and-recreate through the reclaim path at `create:196-230`, which leaks a payable provider subscription if the cancel call fails. |
| **Existing subscriber runs to zero credits** | `models/subscription.ts:79-85` blocks a second live subscription, so they are shown UNLOCK30 and **cannot redeem it**. **Gate the modal on having no live subscription and route them to a top-up instead.** This is a real gap in the mockups; it is a UI fix, not a billing one. |
| **Code leaks and circulates publicly** | There is no rate limiting anywhere in the app. Bounded by: one `granted` row per user ever (DB-enforced); ceiling on credit balance; global cap. Worst case is **COGS on bonus credits, not cash.** Under A/B/D a leaked code is direct revenue loss on every redemption. |
| **Concurrent captures racing the per-user unique index** | Second one throws E11000 out of the transaction, is caught at the call site, logged. Customer gets one bonus. Correct by construction. |

### Gaps I am NOT hiding

1. **C does not deliver a price discount.** The Razorpay sheet shows full price. With "15% OFF" copy that causes abandonment; with "+15% bonus credits" it is expected. **This is the decision, and it belongs to the founder, not to engineering.**
2. **Bonus credits never expire and are never clawed back on cancellation** (`models/userBilling.ts` has no expiry field; `webhooks.ts:209` does not touch the wallet). "Subscribe with UNLOCK30, keep 450 credits, cancel" is supported behaviour. Bounded to once per user by the unique index.
3. **Coupons deepen a pre-existing arbitrage.** `sub_month_3` already beats `topup_std_120` on price-per-credit by ~58% at list price with no coupon at all; the bonus widens it to ~65%. The marginal damage attributable to coupons is ~7 points. **The underlying subscription-vs-topup price ratio is the real problem and the coupon program did not create it.**
4. **The global redemption cap is approximate under concurrency.** It is a `countDocuments` guard, not an atomic counter; it can overshoot by a handful. Acceptable for a COGS-bounded giveaway; it would not be for cash.
5. **The authentication-transaction amount question (§3 item 8) is unresolved and applies to C too.** If Razorpay ever charges a token amount rather than the plan amount on the auth transaction for some payment method, `verify:72-75` 409s under every mechanism. C does not make this worse; it just does not fix it. **This is the single most important open question on the whole billing stack and it is not a coupon problem.**

---

## 6. Blast radius on the live payment path

Every item below is additive, guarded, and independently revertible. Master kill switch: `COUPONS_ENABLED=false` — an env change, no deploy.

| Change | File:anchor | Risk | Rollback |
|---|---|---|---|
| 3 optional Purchase fields | `models/purchase.ts` | Schema-only, defaults, no index change, no read on any existing path | Leave in place; harmless with the flag off |
| New CouponRedemption model + indexes | `models/couponRedemption.ts` | New collection; touches nothing existing | Drop collection |
| Accept `couponCode`, attach on new path | `create/route.ts` ~:297, :299 | **Money path.** After all existing logic, in try/catch, sets fields nothing compares | Flag off → param ignored; or revert the try/catch block |
| Attach on reuse path | `create/route.ts` :179 | **Money path.** `$set` on a reused Purchase, guarded on `couponCode == null` | Same |
| `applyCouponBonusForPurchase` | `lib/billing/db.ts` (new) | New function; no existing caller changed | Delete; callers are try/catch'd |
| 3 grant call sites | `verify/route.ts:109`, `webhooks.ts:304`, `subscription-cycle-reconciliation.ts:132` | **Money path.** Each is one call inside a try/catch that logs and swallows — cannot fail verification or a webhook ack | Remove the three call lines |
| Refund clawback term | `db.ts:1584` | **Money path, inside the refund transaction.** One added summand, gated on a boolean that is false for every existing row | Revert the one line |
| History regex | `history/route.ts:26` | Read-only display | Revert |
| Cycle-key hardening (Step 0) | `db.ts:875` | **Money path, hottest function.** Ships as its own PR, before coupons | Revert that PR independently |

**Not touched:** `lib/billing/razorpay.ts` (zero provider changes), the plan cache at `create:238`, `pricedProduct.amountPaise`, `createPurchaseRecord`'s amount, `payment-verification.ts`, the reclaim path at `create:196-230`, `applyPurchaseCredits`, `purchase.bonusCredits`, and every amount or currency comparison in the codebase.

---

## 7. Test plan

**Context that must not be forgotten: no purchase in production has ever reached `captured` (23 rows: 12 failed, 11 pending). The only paying customer got credits via the webhook against an uncaptured purchase row.** The first coupon checkout is therefore also the first proof that `verify` works end to end. Plan for that, not for the coupon.

**Unit / integration**
- `Math.floor(creditsGranted * pct / 100)` for all 4 codes × 3 monthly products = the 12-cell table in §4.1. Assert yearly codes are rejected.
- `applyCouponBonusForPurchase` called twice → exactly one ledger row, one `$inc`. Called from all three paths concurrently → one row.
- Per-user unique partial index: second `granted` row for the same user throws E11000, is caught, and **does not corrupt the first grant or the wallet**.
- **Replay test against a real replica set** (there is currently no test anywhere covering E11000 inside a transaction — `grep -rn 11000 test` returns nothing): assert the wallet balance is unchanged after a duplicate grant attempt.
- Refund: full refund of a coupon'd purchase claws back `creditsGranted + couponBonusCredits`. Partial refund claws back proportionally. A purchase with `couponBonusApplied === false` behaves exactly as today.
- Reuse path: create with no code → retry with a code → assert the coupon lands on the reused Purchase and the amount is untouched.
- **Verify the live index exists** before trusting any of this: `db.creditledgers.getIndexes()` must show `idempotencyKey` unique. It is currently inferred from a schema declaration and a code comment, not observed.

**Manual end-to-end, LIVE mode, real card — MUST PASS BEFORE THE SECOND CODE IS ENABLED**

1. Test account, balance driven to 0. Enable **UNLOCK30 only** (largest bonus, highest-intent trigger — test the worst case first).
2. Validate → expect `bonusCredits: 45` for `sub_month_1` (₹149 — cheapest real charge, cheapest to refund).
3. Complete the mandate with a real card. Then assert, in this order:
   - Razorpay Dashboard shows a **₹149** capture — full price, no discount.
   - `Purchase.status === "captured"`, `razorpayPaymentId` non-null, `notes.clientSubscriptionConfirmation` present. **This is the first time this has ever happened in production. If it fails, stop everything — the problem is `verify`, not coupons.**
   - Exactly two ledger rows: `subscription-cycle:…` (+150) and `coupon-bonus:…` (+45).
   - `UserBilling.availableCredits` = +195. Legacy user credits mirror agrees.
   - `CouponRedemption` = `granted`.
   - Both bonus and cycle rows appear in `/api/billing/history`.
4. Attempt a second redemption on the same account with a different code → rejected by the unique index, **no ledger row, no wallet change**.
5. Refund the ₹149 via `/api/admin/billing/refunds` → assert 195 credits reversed, not 150.
6. Let the cron run → assert `applyCouponBonusForPurchase` is a clean no-op and the consistency check reports zero orphans.

**Do not simulate this with test-mode keys alone.** Test mode has never exercised the production webhook signing path, the live plan cache, or the live reconciler.

---

## 8. Rollout order

1. **Step 0 PR** — cycle-key dedupe hardening + `buildSubscriptionCycleKey` import. Merge, deploy, **soak 48h.**
   **Gate:** no new duplicate-grant alerts; the daily cron completes green twice.
2. **Verify the live `creditledgers.idempotencyKey` unique index exists.**
   **Gate:** `getIndexes()` shows it. If it does not, **stop** — every idempotency guarantee in this design is void until it is built.
3. **Coupon PR merged with `COUPONS_ENABLED=false`.** Dead code in production; schema fields default-null on every existing row.
   **Gate:** an ordinary full-price subscription checkout still completes; verify still 409s nothing new; no diff in behaviour anywhere.
4. **Run the existing `migrate:reconcile-subscription-purchases` script** (added in `b7ca9c4`, **never yet run against production** because `RAZORPAY_KEY_SECRET` is marked sensitive in Vercel). It repairs historical pending rows against a live Razorpay check.
   **Gate:** at least one historical purchase reaches `captured`, or the script reports that none legitimately qualify. **Do not enable a code while zero purchases have ever been captured — you would be testing two unproven systems at once.**
5. **Enable UNLOCK30 only**, global cap 50, for the internal team.
   **Gate:** the full §7 manual E2E passes on a real card, including the refund step.
6. **Open UNLOCK30 to real users**, cap 200. Soak one week.
   **Gate:** zero rows where `couponCode != null && couponBonusApplied === false` older than 24h; zero new `pending` purchases; zero duplicate `coupon-bonus:` keys; wallet totals reconcile against the ledger.
7. **Enable TOPUP25, then BOOST20, then WELCOME15**, one per week, same gate each time.
   Between steps 6 and 7, revisit whether the ladder should ship at all — the economics say a single code at 30% is what you are actually operating, and the three lower codes add leak surface for close to zero incremental conversion.
8. **If and only if the founder rejects the credit framing:** open the §3 must-ask list with Razorpay support in writing, settle "Single Use vs Limited-cycles = 1" empirically in test mode, and then implement Mechanism A **INR-only, monthly-only, "Show Offer on Checkout" OFF, "On Payment Failure" set to "Do not allow the payment to go through"**, with `purchase.amountPaise` sourced by reading the invoice back from Razorpay rather than computed locally — **and keep C in place for every non-INR customer**, because offers will never serve them.