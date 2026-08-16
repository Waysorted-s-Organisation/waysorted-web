## 1. Decision

**No mechanism satisfies all five constraints as the repository stands today, because constraint 4 is already violated before any coupon exists: subscription renewals write no `Purchase` row and no money figure anywhere durable (`lib/billing/webhooks.ts:267-323` → `applySubscriptionCycleCredits` at `lib/billing/db.ts:875-952`, which takes `{subscription, cycleKey, paymentId}` and no amount). For a monthly subscriber exactly 1 of 12 payments is recorded as money.**

The best available trade is **mechanism G, shipped and described honestly as J**: a self-authored Razorpay plan whose `item.amount` *is* the discounted price, immediate start, presented to the customer as a persisting member rate rather than "15% off your first month" — **plus** a new `RevenueEvent` write on every cycle to close constraint 4.

**The constraint that bends, and by exactly how much:** none of the five. What bends is the *product promise*. G/J reduces the charged price by the discount percentage on **every** cycle for the life of the subscription, not just the first, and that is **irreversible per subscriber** — Razorpay returns `400 "subscriptions cannot be updated when payment mode is UPI"` and `400 "subscriptions cannot be updated when payment mode is emandate"` (solution text: *"Emandate subscriptions are immutable post-authentication. Cancel and create a new Subscription if changes are needed."*), and for domestic cards *"For Subscriptions created using domestic cards, you can update only the offer that is linked to them"* — while offers themselves are unavailable in international currency. So there is no cohort for which "raise it back at cycle 2" is a documented, supported operation. Choosing G **is** choosing J; the founder must sign off on cost = `discount × ARPU × average lifetime in cycles`, roughly 12× the intended cost at a 12-month life, compounded because `applySubscriptionCycleCredits` grants 100% of catalog credits regardless of amount paid (`lib/billing/db.ts:881-889`).

**The single decisive reason:** G/J is the only mechanism where the integer Razorpay charges is an integer *we* authored and wrote into `purchase.amountPaise` in the same request, so the exact-equality gate at `app/api/billing/subscriptions/verify/route.ts:73-76` holds **by construction, with no change to that line**, in every currency and on every payment method — and it leaves the webhook state machine, both reconcilers, and the entire recovery layer untouched. Every other candidate requires editing money paths that have never once executed successfully in production (no purchase has ever reached `captured`).

---

## 2. Why not the others

**H — `start_at` + `addons`.** Its price arithmetic is genuinely confirmed (see §3), and it is the *only* mechanism that delivers a true first-cycle-only discount. It is disqualified on constraint 5, not on arithmetic. Razorpay's own Subscriptions FAQ Q7 states, unqualified: *"You are unable to use the Add-Ons feature since it is deprecated."* If `addons` is silently ignored rather than rejected, a future-start subscription collects the ₹5 auto-refunded token instead of the discounted price — the customer gets a free month and `verify:73-76` 409s after the token was captured. Beyond that, H forces edits to six money-critical files: `lib/billing/webhooks.ts:40` (authenticated → `payment_pending` for ~30 days), `lib/billing/subscription-reconciliation.ts:70-98` (the orphan canceller — it *does* skip when a captured purchase carries `notes.clientSubscriptionConfirmation` at `:71-79`, so it will not cancel a *verified* H subscription, but the `subscription.activated` rescue at `webhooks.ts:41-43` that today saves a missed verify within seconds is 30 days away, so any dismissed tab becomes a cancelled paid mandate), `lib/billing/subscription-cycle-reconciliation.ts:58-63` (scans only `active`/`cancel_scheduled`, so the discounted cycle has **no** backstop), `create/route.ts:128-131` (hands an already-authenticated subscription back to Checkout for a month), `models/subscription.ts:77-88` (the live-subscription index), and `billing-client.tsx:545-558` (the poll waits for `status !== "payment_pending"`, so **100%** of discounted customers would see the failure-flavoured *"Entitlement sync is pending; keep this reference for support"*). Keep H on the shelf as the upgrade path once Razorpay answers in writing.

**I — discounted order then future-dated subscription.** Dead on the same confirmed table that supports H: the subscription leg carries no upfront, so its authorisation is a *token* amount that is auto-refunded (₹5 on the IN docs; the amount is locale-substituted, so the non-INR value is unknown). `verify:73-76` compares that token against the full plan price and 409s after capture on every single redemption; `verify:84-96` is the sole writer of `clientSubscriptionConfirmation`, so `subscription-reconciliation.ts:80-98` then cancels the mandate the customer just authorised. It also needs `checkout/order/route.ts:39` (which rejects `kind === "subscription"`), two Checkout sheets, two authorisations, and creates an orphan class — order paid, mandate abandoned — that all three reconcilers structurally skip. And `models/purchase.ts:57` (`min: 100`) makes the honest subscription-side amount unrecordable for a low-value token.

**Razorpay Offers.** Re-verified from the primary source, not inherited: *"We do not support offers on international currency and the CFB (Customer Fee Bearer) model."* Fails constraint 2 outright. This is worth stating precisely because Offers are otherwise the *ideal* shape — the Subscription Offers page documents `Single Use` ("a one-time discount offered to the customer") and `Limited number of cycles`, and offers can be linked at creation via `offer_id` and removed later, with *"invoices generated after the offer is removed will be charged in full."* That is exactly the first-cycle-only semantics we want. It is unusable only because of the international-currency exclusion. If the founder ever accepts INR-only, revisit this first.

**Update Subscription plan-swap.** Correctly excluded, and I re-verified with harder citations than the brief had: 400 for UPI, 400 for emandate, offer-only for domestic cards, and *"Subscriptions in the `created`, `pending` or `halted` state cannot be updated."*

**Charge-full-then-refund-the-discount (a K candidate I evaluated and rejected).** Would work in every currency and method with zero provider unknowns, and would give perfect gross/net records. Rejected because the customer's statement shows the full price (violating the spirit of constraint 1), the money comes back in 5-7 days with FX loss on both legs, and it collides head-on with `recordRefundAdjustment` (`lib/billing/db.ts:1585-1593`), which claws back credits in proportion to `refundedAmountPaise / amountPaise` — a 15% refund would silently revoke 15% of the customer's credits. Suppressing that means editing the refund money path.

**Recurring Payments / charge-at-will, and emandate "charge customer during registration."** The former is the only architecture with true per-cycle amount control, at the cost of rebuilding dunning, retries, invoices and states — categorically disqualified by constraint 5. The latter is HDFC/ICICI-only, netbanking-only, INR-only, on-demand — fails constraints 2 and 3.

---

## 3. CONFIRMED vs MUST ASK RAZORPAY

### CONFIRMED — with citation

**Provider**

| Fact | Citation |
|---|---|
| Plans may be created in any supported currency: *"Create the plan in the currency you want to charge the customer. You can select any one of our supported currencies to create a Plan."* | https://razorpay.com/docs/payments/subscriptions/create-plans/ |
| *"Once a Plan is created, you cannot edit or delete it."* / FAQ: *"No. You cannot update or delete a Plan. You should create a new Plan."* | create-plans/ ; https://razorpay.com/docs/payments/subscriptions/faqs/ |
| *"Can I accept Subscription payments in currencies other than INR? Yes. You can accept Subscription payments in any of the supported currencies."* | faqs/ |
| *"Settlements are always made in INR. The payment is converted using the exchange rate at the time of payment creation."* | faqs/ |
| Cards: international currencies supported. **UPI**: *"…when recurring charge is less than ₹15,000. Only INR is supported."* **eMandates (NetBanking)**: *"Only INR is supported."* | faqs/ |
| Card subscriptions: *"For plans up to a maximum of ₹15,000, debits are processed without any intervention from customers."* Above that, AFA on every subsequent debit (except listed MCCs). All six catalog subscription prices (149/349/749 monthly, 1499/3499/7499 yearly, `lib/billing/catalog.ts:159-237`) are under ₹15,000. | faqs/ |
| Offers: *"We do not support offers on international currency and the CFB (Customer Fee Bearer) model."* | https://razorpay.com/docs/payments/offers/ |
| Update Subscription: `400 "subscriptions cannot be updated when payment mode is UPI"`; `400 "subscriptions cannot be updated when payment mode is emandate."` with solution *"Emandate subscriptions are immutable post-authentication."*; `400 "Can't update Subscription when Subscription is not in Authenticated or Active state"` | https://razorpay.com/docs/api/payments/subscriptions/update-subscription/ |
| *"For Subscriptions created using domestic cards, you can update only the offer that is linked to them."* | https://razorpay.com/docs/payments/subscriptions/update/ |
| Authentication Amount table (decoded from the page's MDX payload — the tables render client-side and are empty in a plain fetch): Immediate/no-upfront → **Plan Amount**; Future/no-upfront → **₹5 (auto refunded)**; Immediate/upfront → **Upfront Amount + Plan Amount**; Future/upfront → **Upfront Amount** | https://razorpay.com/docs/payments/subscriptions/workflow/ |
| Invoice table: Immediate/no → Yes; Future/no → *"No (Reason: Auth transaction)"*; Immediate/upfront → Yes; Future/upfront → **Yes** | workflow/ |
| *"In case of immediate start dates, the authentication transaction amount is not refunded and invoices are generated in all the three scenarios."* → **our current immediate-start configuration is the favourable branch** | workflow/ |
| *"No. You do not need to capture payments made for a Subscription. Upfront amount and subsequent charges are auto-captured."* (Watch Out: *"The payment will not be captured if you cancel the Subscription before it gets authorised."*) | faqs/ |
| *"No. You do not need to capture the ₹5 token authorisation payment used to validate a customer's card or UPI ID. This amount is auto-refunded."* | faqs/ |
| FAQ Q7, unqualified: *"You are unable to use the Add-Ons feature since it is deprecated."* — yet Create Subscription still fully documents `addons` with 8-language samples, `addons.item.currency` = *"This has to match the plan currency."*, plus `start_at`, `expire_by`, `offer_id`. **No `max_amount` parameter exists on Create Subscription.** | faqs/ ; https://razorpay.com/docs/api/payments/subscriptions/create-subscription/ |
| eMandate: *"If you do not set a limit for the mandate, the maximum limit defaults to ₹1,00,00,000 for Emandates."* — i.e. the eMandate ceiling is **not** derived from the authentication amount. | faqs/ |
| Subscription Offers support `Single Use` and `Limited number of cycles`; removing an offer means *"invoices generated after the offer is removed will be charged in full."* | https://razorpay.com/docs/payments/subscriptions/offers/ |

**Repo** — every line below read on branch `main`

- `subscriptions/verify/route.ts:70-72` requires `captured`; `:73-76` is exact-integer amount **fused with** an uppercased currency compare; `:77-82` compares `providerSubscription.notes.productCode` to `purchase.productCode`; `:84-96` is the **only** writer of `notes.clientSubscriptionConfirmation`; `:106-130` grants first-cycle credits inline.
- `lib/billing/payment-verification.ts:46-49` applies the identical rule to one-time orders.
- `subscriptions/create/route.ts:238` — `planKey = ${currency}:${amountPaise}:${tier}`; `:239-261` is a **read-modify-save** of `metadata.providerPlans` (lost-update race; Razorpay plans are undeletable, so a dropped key leaks a permanent plan).
- `:264` reuses a Purchase by idempotency key with **no** amount/currency/status/age guard. The equivalent one-time route **does** have that guard at `checkout/order/route.ts:94-104` with a comment explaining exactly this hazard.
- `:128-131` + `:157-190` reuse branch; `:162-164` treats `amountSubunits === null/undefined` as a **match**, so a legacy row matches at any price.
- `:196-230` reclaim; on cancel failure sets `providerCancellationPending` (`db.ts:769-775`) — **grepped repo-wide: nothing ever reads that field**, and `releaseSupersededPendingSubscription` (`db.ts:749-759`) sets status `expired`, which the reconciler's `status: "payment_pending"` query (`subscription-reconciliation.ts:29-32`) never revisits. Every failed reclaim leaks a live payable subscription, permanently.
- `db.ts:582-600` `createPurchaseRecord` writes `amountPaise`/`currency` from `pricedProduct` and `creditsGranted`/`bonusCredits` from the catalog.
- `subscription-reconciliation.ts:8` `DEFAULT_MINIMUM_AGE_MS = 2h` is a **minimum age**, not a schedule; `vercel.json` has exactly one cron, `0 4 * * *` → `app/api/cron/n4-product-recall/route.ts:59-68`. So cancellation lands 2–26h after authorisation. `:70-79` **skips** (`continue`, indefinitely) when a captured Purchase carrying `clientSubscriptionConfirmation` exists; `:80-98` otherwise cancels and flips pending Purchases to `failed`.
- `subscription-cycle-reconciliation.ts:58-63` scans only `status ∈ {active, cancel_scheduled}` with `providerSubscriptionId: /^sub_/`; `:123-130` collects `invoice.amount_paid`/`currency` into an in-memory array that is **never persisted**, and only on the branch where the webhook grant was **missing**.
- `applySubscriptionCycleCredits` (`db.ts:875-952`) derives the grant purely from `getCatalogProduct(planCode)` (`:881`, `:889`); ledger metadata (`:899-905`) carries **no amount and no currency**; `:932` force-sets `UserBilling.subscriptionStatus` to `active`.
- `models/purchase.ts:57` `min: 100` is currency-blind, while `lib/billing/money.ts:26-28` `minimumChargeSubunits` already exists and is currency-aware.
- `models/subscription.ts:77-88` `one_live_subscription_per_user` partial unique index over `{payment_pending, active, cancel_scheduled, halted}`.
- `app/billing/billing-client.tsx:207/457-458` memoise the attempt key per product; it is deleted at `:485` (quote change), `:541` (verify success) and `:577` (catch) — but **not** in `modal.ondismiss` (`:516-519`) and **not** in the `payment.failed` handler (`:568-573`).
- `recordRefundAdjustment` (`db.ts:1585-1593`) claws back credits as `floor(totalCredits × cumulativeRefund / purchase.amountPaise)`.
- Renewals create no Purchase anywhere: grepped `webhooks.ts` and `subscription-cycle-reconciliation.ts` for purchase creation — zero hits.

### MUST ASK RAZORPAY — no documentation settles these

1. **Highest priority, blocks nothing in J but gates H forever.** Is the creation-time `addons` array on `POST /v1/subscriptions` deprecated, or does FAQ Q7 refer only to the standalone Add-on entity (`POST /v1/subscriptions/:id/addons` and the Dashboard screen)? If deprecated, is it a hard `400` or **silently ignored**? Silent-ignore is the fail-open case that would give discounted customers a free month.
2. **For a Subscription, what maximum amount is registered with the bank / NPCI / card network as the mandate ceiling** — the plan amount × quantity, the authentication amount, or a fixed band? Ask separately for domestic card, international card, UPI AutoPay and eMandate. Create Subscription exposes no `max_amount`, so the derivation is entirely internal. *This matters for J in one direction only, and favourably:* under J the price never rises, so no subscriber can ever hit a mandate-max failure. It becomes blocking the moment anyone proposes restoring full price later.
3. **Does `payment.amount` on the authorisation transaction of an immediate-start subscription always equal `plan.item.amount × quantity`, for domestic card, international card, UPI AutoPay and eMandate?** The workflow page says the authentication transaction *"can either be a token amount that is refunded… or an upfront amount or the plan amount that is not refunded"*, and the "not refunded" callout is scoped to immediate starts without explicitly promising the full plan amount. **This is mechanism-independent and has never once executed successfully in production.** It must be settled in test mode before any coupon ships (see §8 gate 3).
4. **For an international-currency subscription payment, does `GET /v1/payments/:id` return `amount`/`currency` in the presentment currency (e.g. USD subunits) or the settlement currency (INR)?** Confirm `base_amount`/`base_currency` semantics for subscription payments specifically, and whether they appear on the `subscription.charged` payload or require a re-fetch. `verify:73-76` compares presentment values.
5. **Which currencies is international payments actually enabled for on our merchant ID**, and is Subscriptions/Plans enablement separate from one-time Orders? (The 2021 `razorpay-python` issue #148 closed without the reporter ever succeeding with USD plans; the thread points at an account permission, not an API limit.)
6. **Authoritative currency-exponent list for all 42 currencies in `CURRENCY_PER_INR`.** `lib/billing/money.ts:1-7` treats only JPY/KRW/VND/CLP as zero-decimal and KWD as three-decimal. An exponent mismatch on HUF or COP is a **100× overcharge on an auto-captured payment**, not a rounding nit.
7. **Is there an account-level cap on the number of Plans, or a rate limit on `POST /v1/plans`?** Plans can never be deleted and `planKey` embeds `amountPaise`, so every FX-table or price revision permanently mints up to 43 more plans per product.
8. **Are `payment.fee` and `payment.tax` denominated in the charge currency or in INR**, and what is the per-method fee schedule for a subscription renewal (international card / domestic card / UPI AutoPay)? Needed to accrue royalties on net.
9. **Is `payment.base_amount` final at capture**, or can the INR figure used for settlement differ by the time the settlement lands? Which Settlement Recon field is authoritative?
10. Confirm Razorpay Route cannot be attached to a non-INR payment or a subscription invoice (Route FAQ says INR-only), i.e. the royalty ledger must be entirely ours.

---

## 4. End-to-end implementation

Ordered. Steps 1–4 are **hardening with the feature flag off** and are latent defects today; they must merge and soak before any discount code exists.

---

### STEP 1 — Purchase reuse guard on the subscription path
**File:** `app/api/billing/subscriptions/create/route.ts:264`

Replace the bare `findPurchaseByUserAndIdempotency` reuse with the reviewed guard already in `checkout/order/route.ts:94-104`: reuse only when `existingPurchase.productCode === product.code`, `status ∈ {created, pending}`, age `< 30 min`, **and** `existingPurchase.amountPaise === chargedProduct.amountPaise` **and** `existingPurchase.currency.toUpperCase() === chargedProduct.currency.toUpperCase()`. Otherwise return `409 { code: "checkout_attempt_expired" }` **before** any provider call.

**What breaks if skipped:** the dismiss-then-retry-with-a-code path binds a full-price Purchase to a discounted provider subscription (or vice versa). `verify:73-76` then 409s **after capture**. `verify:84-96` never runs, so `clientSubscriptionConfirmation` is never written, and `subscription-reconciliation.ts:80-98` cancels the mandate at the next 04:00 run and flips the Purchase to `failed`. The Purchase is left stranded at `pending` with an amount that is not the money collected — a permanent, undetectable constraint-4 corruption plus a customer-visible failure. This is inert today only because `amountPaise` never varies; it becomes reachable the instant a discount exists.

---

### STEP 2 — Null `amountSubunits` must be a mismatch
**File:** `app/api/billing/subscriptions/create/route.ts:162-164`

Change to `existingSubscription!.amountSubunits === chargedProduct.amountPaise` — drop the `undefined`/`null` tolerance. Backfill legacy rows in the same PR (a one-shot script setting `amountSubunits` from the catalog price for `status ∈ {active, cancel_scheduled}` rows where it is null), so the change does not push live subscribers down the reclaim path.

**What breaks if skipped:** a row with null `amountSubunits` matches at **any** price, so the reuse branch at `:169-190` hands a customer a provider subscription bound to a plan the current request never validated. With coupons live, a customer can be shown one price and charged another. `ensureSubscriptionRecord` (`db.ts:795-798`) returns an existing row unchanged and never backfills, so nulls do not self-heal.

---

### STEP 3 — Make `providerCancellationPending` mean something; atomic plan-cache write
**Files:** `lib/billing/subscription-reconciliation.ts:29-32`; `app/api/billing/subscriptions/create/route.ts:239-261`

(a) Add a second scan pass in `reconcileStalePendingSubscriptions` over `{ providerCancellationPending: true }` **regardless of status**, retrying `cancelRazorpaySubscription` and clearing the flag on success.
(b) Replace the read-modify-save of `metadata.providerPlans` with a positional update — `BillingProduct.updateOne({ code }, { $set: { ["metadata.providerPlans." + planKey]: plan.id, ...(productDoc.providerPlanId ? {} : { providerPlanId: plan.id }) } })` — preserving the `providerPlanId ||=` write at `:252`. Pin the `planKey` format in a unit test first (`:` is a legal Mongo field-name character; the amount segment is a stringified number).

**What breaks if skipped:** (a) every failed reclaim leaks a live, payable Razorpay subscription with no recovery path — and coupons drive *more* traffic through the reclaim branch, because a changed price is exactly what makes `reusedPlanIdentityMatches` false. (b) two concurrent creates for different `planKey`s lose one key permanently; the orphaned plan cannot be deleted at Razorpay, and the next request mints yet another.

---

### STEP 4 — Currency-aware minimum on `Purchase.amountPaise`
**File:** `models/purchase.ts:57`

Replace `min: 100` with a schema-level validator calling `minimumChargeSubunits(this.currency)` (`lib/billing/money.ts:26-28`).

**What breaks if skipped:** a deep discount on a low-value tier throws an uncaught Mongoose `ValidationError` inside `subscriptions/create` — surfaced as a generic 500 by the catch at `:336-352`, **after** a payable provider plan may already exist. It is also simultaneously wrong in both directions today (too low for KWD at 0.100 KWD, too high for JPY, blocking ¥1–99).

---

### STEP 5 — Data model (all of it, once, so history is never migrated twice)

**5a. `models/coupon.ts` (new)**
```
code            String, required, unique, uppercase, trim
discountBps     Number, required, min 1, max 5000      // 1500 = 15%
status          enum ["active","paused","expired"], default "active"
validFrom       Date, required
validUntil      Date, required                          // hard expiry, non-null
maxRedemptions  Number, required, min 1                  // global cap, non-null
redemptionCount Number, required, default 0
productCodes    [String]                                 // empty = all subscription products
allowedTiers    [String]  // empty = all
allowedCurrencies [String] // empty = all
notes           Mixed
```
`validUntil` and `maxRedemptions` are **required and non-nullable by schema**. A code with no cap is an unbounded, unrevocable liability, and §2 established there is no way to revoke a discount already bound to a live subscription.

**5b. `models/couponRedemption.ts` (new)**
```
user, code, discountBps
state          enum ["reserved","confirmed","released"], default "reserved"
purchase       ObjectId | null
subscription   ObjectId | null
providerSubscriptionId String | null
listAmountSubunits, chargedAmountSubunits, discountAmountSubunits, currency
reservedAt, confirmedAt, releasedAt, releaseReason
```
Indexes:
- `{ user: 1 }` **unique, partialFilterExpression `{ state: { $in: ["reserved","confirmed"] } }`** — one promotional redemption per user **across all codes**, ever. This is the control that stops serial cancel-and-resubscribe.
- `{ code: 1, state: 1 }`, `{ state: 1, reservedAt: 1 }` for the expiry sweeper.

**5c. `models/purchase.ts` — add (all defaulting so existing rows are valid)**
```
listAmountSubunits      Number | null   // gross catalog price before discount
discountAmountSubunits  Number, default 0
couponCode              String | null
discountBps             Number, default 0
// royalty fields, populated from the payment fetch — see 5e
baseAmountSubunits      Number | null
baseCurrency            String | null
fxBasis                 enum ["provider_base_amount","static_table","unknown"], default "unknown"
providerFeeSubunits     Number | null
providerTaxSubunits     Number | null
paymentMethod           String | null
isInternational         Boolean | null
attributionKey          String | null   // capture NOW even though no partner exists
```

**5d. `models/subscription.ts` — add**
```
couponCode          String | null
discountBps         Number, default 0
listAmountSubunits  Number | null   // full catalog price at this tier/currency
```
`amountSubunits` keeps its existing meaning and **must be written as the DISCOUNTED (actually charged) amount**, because `create/route.ts:157-167` compares it against what the plan will charge. `listAmountSubunits` carries the catalog price so the drift detector (Step 12) can tell "discounted on purpose" from "bound to a stale plan".

**5e. `models/revenueEvent.ts` (new) — this is what closes constraint 4**
```
user, subscription | null, purchase | null, partner | null
kind            enum ["subscription_initial","subscription_renewal","one_time","refund"]
providerPaymentId  String, unique sparse
providerInvoiceId, providerOrderId, providerSubscriptionId
cycleKey        String | null            // from buildSubscriptionCycleKey — joins to CreditLedger
occurredAt      Date
listAmountSubunits, discountAmountSubunits, couponCode, discountBps
chargedAmountSubunits, currency
baseAmountSubunits, baseCurrency, fxBasis
providerFeeSubunits, providerTaxSubunits, netToMerchantSubunits
settlementId, settledAt, settlementStatus
attributionKey, attributionModel, royaltyRateBps, royaltyBasis
royaltyState    enum ["pending","accrued","paid","reversed"], default "pending"
rawPaymentSnapshot  Mixed                // NOT TTL'd
```
Unique index on `providerPaymentId` makes every writer idempotent.

**What breaks if skipped:** the discount has nowhere to live except an inferred subtraction; renewals stay amount-free forever; and attribution — the **one** royalty input that cannot be re-derived from Razorpay later — is lost for every customer acquired between now and whenever the royalty system ships. Fees, FX and amounts can all be backfilled from the provider. Who referred the customer cannot.

---

### STEP 6 — Widen `fetchRazorpayPayment`
**File:** `lib/billing/razorpay.ts:83-94`

Add `base_amount?`, `base_currency?`, `fee?`, `tax?`, `international?`, `method?`, `created_at?` to the return type. This is a **type-only** change — `razorpayRequest` already returns the full parsed JSON and the fields are erased by the narrow declaration, not stripped. Treat `base_amount`/`base_currency` as optional (documented only on the currency-conversion page and absent when currency is INR — see MUST-ASK #4). Also add `start_at?: number` to `RazorpaySubscription` at `:51-63` while you are in the file; it costs nothing and H needs it later.

**What breaks if skipped:** the royalty ledger has no FX basis and no fee data, and `basePriceInr` — derived from the hardcoded `CURRENCY_PER_INR` table at `lib/billing/regional-pricing.ts` and stored at `db.ts:589` — is a **catalog anchor, not a conversion of money collected**. Paying a partner a percentage of it pays a percentage of a number no bank ever produced. Rename it `listPriceInr` in the same PR, or at minimum comment it, so nobody wires it into a payout.

---

### STEP 7 — Provider setup

No new Razorpay configuration. The lazy plan creation at `create/route.ts:242-262` already handles it: because `planKey` at `:238` embeds `amountPaise`, a discounted price **automatically** resolves to a different cache key and mints its own plan, in the correct currency, with `item.currency` passed straight through by `createRazorpayPlan` (`razorpay.ts:136-162`). Full-price customers keep using the full-price plan id with byte-identical behaviour. Two codes at the same percentage share one plan — desirable.

Do add `notes.couponCode` and `notes.discountBps` to both `createRazorpayPlan` (`:156-159`) and `createRazorpaySubscription` (`:172-178`) so the discount is legible in the Razorpay Dashboard and in every webhook payload. Do **not** change `notes.productCode` — `verify:77-82` compares it.

**What breaks if skipped:** nothing functionally; but a discounted plan is indistinguishable from a repricing in the Dashboard, and support cannot answer "why is this customer paying ₹126.65?".

---

### STEP 8 — `subscriptions/create`: the single discount function

Introduce **one** function, the only place a discount is ever computed:

```ts
// lib/billing/coupons.ts
export async function resolveChargedProduct(input: {
  userId: string; pricedProduct: RegionalPricedProduct;
  pricing: PricingContext; couponCode?: string | null;
}): Promise<{
  chargedProduct: RegionalPricedProduct;   // amountPaise = discounted
  listAmountSubunits: number;
  discountAmountSubunits: number;
  coupon: CouponDocument | null;
}>
```
with `discounted = Math.max(minimumChargeSubunits(currency), Math.round(list * (10000 - bps) / 10000))`. **With the flag off, or with no code, this is the identity function** — `chargedProduct === pricedProduct` — so every downstream line is provably unchanged.

Then, in `app/api/billing/subscriptions/create/route.ts`:

| Anchor | Change |
|---|---|
| `:35-42` body type | add `couponCode?: string` |
| `:57` | `idempotencyKey = \`subscription:${userId}:${clientAttemptKey}:${normalisedCoupon ?? "none"}\`` |
| after `:68` | call `resolveChargedProduct`; on invalid/expired/capped/already-redeemed code return `409 { code: "coupon_not_applicable", reason }` **before** any provider call |
| `:85-106` quote guard | compare `body.quotedAmountSubunits` against **`chargedProduct.amountPaise`**, and additionally require `body.couponCode === resolvedCode` |
| `:157-167` | compare against `chargedProduct.amountPaise` (plus Step 2) |
| `:238` planKey | `${chargedProduct.currency}:${chargedProduct.amountPaise}:${tier}` |
| `:243-250` | `createRazorpayPlan({ amountPaise: chargedProduct.amountPaise, ... })` + coupon notes |
| `:264-279` | Step 1 guard; pass `chargedProduct` to `createPurchaseRecord`, plus `listAmountSubunits`, `discountAmountSubunits`, `couponCode`, `discountBps` |
| `:281-293` | coupon notes on the subscription |
| `:299-308` | `amountSubunits: chargedProduct.amountPaise`, `listAmountSubunits: pricedProduct.amountPaise`, `couponCode`, `discountBps` |
| `:317-328` | notification carries `chargedProduct.amountPaise` |

Also add `listAmountSubunits`/`discountAmountSubunits`/`couponCode`/`discountBps` params to `createPurchaseRecord` (`db.ts:565-601`).

**What breaks if skipped, per line:** `:57` — dismiss-then-apply-code reuses the wrong-priced Purchase (Step 1 turns that into a clean 409 rather than a post-capture 409, but keying on the coupon makes the retry *succeed* instead of erroring). `:85-106` — the client displays the discounted price, the server compares it to the full price, and **every single redemption** 409s with `pricing_quote_changed`. `:238` — the discounted subscription is created against the **full-price** plan and the customer is charged full price. `:267-279` — `purchase.amountPaise` holds the catalog price while Razorpay charges the discounted one, so `verify:73-76` 409s after capture on every redemption and the reconciler cancels the mandate. `:306` — the reuse-identity check compares the full price to a discounted plan, permanently forcing every retry through the reclaim path.

Client (`app/billing/billing-client.tsx`): add the code input, send `couponCode` alongside `quotedAmountSubunits` at `:468`, and — independently valuable — **delete the attempt key in `modal.ondismiss` (`:516-519`) and in the `payment.failed` handler (`:568-573`)**, matching `:485`/`:541`/`:577`.

---

### STEP 9 — `subscriptions/verify`: no change to the money check

`app/api/billing/subscriptions/verify/route.ts:70-82` stays **exactly as written**. That is the point of choosing G/J: `payment.amount === purchase.amountPaise` holds by construction because we authored both integers in the same request.

Add only, after the successful save at `:96` and alongside the credit grant at `:106-130`:
1. `CouponRedemption.updateOne({ purchase: purchase._id, state: "reserved" }, { $set: { state: "confirmed", confirmedAt: new Date(), subscription, providerSubscriptionId } })`.
2. Write the `RevenueEvent` row (`kind: "subscription_initial"`, `cycleKey: buildSubscriptionCycleKey(subscriptionId, paymentId)`, amounts from the now-widened `fetchRazorpayPayment`, `rawPaymentSnapshot: payment`). Wrap in the same try/catch shape as the credit grant at `:121-130` — **never fail verification over a ledger write**, the payment is already captured.

**What breaks if skipped:** (1) the global cap never decrements against confirmed redemptions and a released reservation can be double-spent; (2) cycle 1 has no revenue record either, and the royalty system starts from zero.

---

### STEP 10 — Redemption lifecycle, with every release path

**Reserve** — inside `resolveChargedProduct`, in one transaction: `Coupon.findOneAndUpdate({ code, status: "active", validFrom: {$lte: now}, validUntil: {$gte: now}, $expr: { $lt: ["$redemptionCount", "$maxRedemptions"] } }, { $inc: { redemptionCount: 1 } })` + `CouponRedemption.create({ state: "reserved" })`. The unique partial index on `{user}` makes a second concurrent reservation E11000 → surface as `409 coupon_already_redeemed`.

**Confirm** — Step 9.

**Release** — must fire on **all seven** of these, each `$inc`-ing `redemptionCount` back down:
1. `create/route.ts:336-352` catch — any throw after reserve, including the E11000 branch at `:341-350`.
2. `create/route.ts:196-230` reclaim — `releaseSupersededPendingSubscription` succeeded, so release the redemption tied to the superseded subscription (`releaseReason: "superseded"`).
3. `create/route.ts:205-213` — the "another checkout in progress" 409.
4. `subscription-reconciliation.ts:87-90` — when pending Purchases are flipped to `failed`, release their redemptions (`releaseReason: "reconciler_expired"`).
5. `subscription-reconciliation.ts:58-61` — same, on the provider-`expired`/`cancelled` branch.
6. **New sweeper in the daily cron:** release any `state: "reserved"` older than 30 minutes with no `captured` Purchase (`releaseReason: "abandoned"`). This is what covers the dismissed sheet and the declined card, neither of which calls the server again.
7. Manual admin release.

**What breaks if skipped:** without (6) in particular, every abandoned checkout permanently burns one unit of the global cap **and** permanently consumes that user's one-redemption-ever slot — a customer whose card is declined can never redeem again, and the code silently exhausts itself against people who never paid.

---

### STEP 11 — Renewal revenue capture (the actual constraint-4 fix)
**File:** `lib/billing/webhooks.ts:267-323`, the `invoice.paid` / `subscription.charged` branch

Immediately after `applySubscriptionCycleCredits` at `:304-308`, write a `RevenueEvent` with `kind: "subscription_renewal"`, the same `cycleKey`, `chargedAmountSubunits` and `currency` from the invoice/payment entity in the payload, and `rawPaymentSnapshot`. Unique `providerPaymentId` makes redelivery a no-op.

Add the same write to the backstop at `subscription-cycle-reconciliation.ts:132-136`, where `invoice.amount_paid` and `invoice.currency` are **already in hand** at `:123-130` and currently thrown away into a non-persisted array.

Backfill: a one-shot script walking `fetchRazorpaySubscriptionInvoices` for every subscription with `providerSubscriptionId: /^sub_/` and inserting historical `RevenueEvent` rows.

**What breaks if skipped:** the royalty system is accurate for cycle 1 and blank for cycles 2..N — an ~11/12 underpayment on monthly subscriptions — and the only surviving trace of a renewal's amount is the raw webhook payload in `RazorpayEventLog`, which carries a **180-day TTL** (`models/razorpayEventLog.ts`). Recurring revenue is not merely unrecorded, it is self-erasing. Lengthen or remove that TTL in the same PR.

---

### STEP 12 — Reconciliation additions

1. **Price-drift detector** (~15 lines in the cron): count `Subscription` rows with `status ∈ {active, cancel_scheduled}` where `amountSubunits !== ` the current catalog price for `(planCode, pricingTier, pricingCurrency)` **and** `couponCode == null`. Report through `collectPaymentAlerts`. This is the only thing that would ever make a subscription bound to a stale or wrongly-discounted plan visible.
2. **Coupon reservation sweeper** — Step 10 (6).
3. **`providerCancellationPending` sweep** — Step 3(a).
4. **Redemption/cap audit**: assert `Coupon.redemptionCount === count(CouponRedemption where state ∈ {reserved, confirmed})` per code; alert on drift.

All four hang off the existing `Promise.allSettled` at `app/api/cron/n4-product-recall/route.ts:59-68`. **What breaks if skipped:** a leaked or miscounted code is invisible until it shows up in the P&L; and (1) is the only detector that catches a plan-cache regression before a customer is charged the wrong amount.

---

## 5. Gap analysis

| Failure mode | Behaviour under G/J after Steps 1–12 | Remaining gap |
|---|---|---|
| **Declined card** | No capture, no Purchase transition, nothing granted. Provider subscription sits in `created`; the daily reconciler cancels it (`subscription-reconciliation.ts:80-98`). Coupon reservation released by the sweeper. **Identical to today.** | None. |
| **Dismissed sheet, then retry with the same code** | Same idempotency key (now coupon-scoped), same amount → `reusedPlanIdentityMatches` holds → `:169-190` returns the same subscription and the same Purchase. Correct. | None. |
| **Dismissed sheet, then retry with a *different*/no code** | Identity mismatch → reclaim at `:196-230` → old redemption released, old provider subscription cancelled → fresh Purchase at the new amount (Step 1 guard makes the old one unreusable) → new subscription. | If `cancelRazorpaySubscription` throws at `:217`, a payable subscription is leaked until the Step 3(a) sweep runs — **up to 24h**. Bounded, monitored, not eliminated. |
| **Lost webhook** | Three independent delivery paths survive untouched: inline grant at `verify:106-130`, `subscription.charged` at `webhooks.ts:304-308`, and the daily backstop at `subscription-cycle-reconciliation.ts:132-136` (which reaches the row because J leaves it `active`, unlike H). | None new. Pre-existing: if the browser closes **and** the webhook is lost, cycle 1 is rescued only by the daily backstop, ~04:00 next day. |
| **Duplicate webhook** | Deduped by the unique `creditledgers.idempotencyKey` and the E11000 catch at `db.ts:907-910`; `RevenueEvent.providerPaymentId` unique makes the new writes idempotent too. | **Untested:** `db.ts:900-910` swallows an E11000 raised inside an open MongoDB transaction and then commits. Whether the commit succeeds after a write error in the transaction is not covered by any test in this repo. Unchanged by this work — but add the integration test rather than letting a coupon feature be the first thing to stress it. |
| **Refund** | `recordRefundAdjustment` (`db.ts:1585-1593`) scales the clawback by `cumulativeRefund / purchase.amountPaise`. Because `amountPaise` **is** the discounted money actually collected, the proportion is correct and a full refund reverses 100% of `purchase.creditsGranted`. **Zero code change.** This is a structural advantage of G/J over every alternative. | `models/refund.ts` has **no `currency` field** and `refund.purchase` is `required: true`. A non-INR refund is uninterpretable without joining to its Purchase, and a refunded **renewal** is literally inexpressible because renewals have no Purchase. Add `currency` and repoint the parent at `RevenueEvent` — listed, not hidden. |
| **Cancellation before cycle 2** | Customer got their discounted cycle(s) and leaves. Under J that is the product. Redemption stays `confirmed`, so the unique partial index on `{user}` prevents a cancel-and-resubscribe loop to re-earn the discount. | If the founder later wants to *allow* re-redemption, the index must change — deliberate, not accidental. |
| **Cycle-2 renewal** | The plan charges the discounted amount forever; `subscription.charged` → credits + `RevenueEvent`. No mandate-ceiling risk because the amount **never rises**. | **THE HEADLINE GAP: the discount is perpetual and per-subscriber irreversible** (§1). Bounded only by `maxRedemptions` × `validUntil` × one-per-user. |
| **2h reconciler firing mid-flow** | J leaves the immediate-authorisation flow untouched: Razorpay moves the subscription to `active` within seconds, `subscription-reconciliation.ts:38-53` marks it active, and the `:70-98` cancel branch is never reached on the happy path. | Pre-existing and unchanged: if `verify` 409s for **any** reason, `clientSubscriptionConfirmation` is never written and the next 04:00 run cancels a paid subscription. Steps 1, 2 and 8 remove every *new* way to reach that 409; they do not remove the class. This is exactly why gate 3 in §8 exists. |
| **Coupon applied to an existing pending subscription** | The code is resolved *before* the reuse branch. If the pending row's `amountSubunits` ≠ the discounted amount, `reusedPlanIdentityMatches` is false → reclaim → clean re-create at the discounted price. If it already matches, the same subscription is returned. | A customer with an `active` subscription is rejected at `:134-151` (`subscription_already_active`) and cannot apply a code without cancelling. **Deliberate** — mid-cycle repricing of a live mandate is exactly what Razorpay's UPI/emandate 400s forbid. Say so in the UI copy. |

**Gaps that remain and are not closed by this plan:**

1. **The perpetual discount is undetectable as a bug** — `applySubscriptionCycleCredits` grants full catalog credits with no amount input (`db.ts:881-889`), so a discounted subscriber receives 100% of credits at a reduced price every cycle forever. Step 12(1) detects *unintended* drift; it cannot detect that an *intended* discount is now unprofitable. That is a pricing decision, not a code problem.
2. **`verify:73-76` has never once succeeded in production.** Every mechanism, including bonus credits, depends on it. Gate 3 in §8 is non-negotiable.
3. **Settlement-level truth (settled INR, fee/tax as actually deducted) arrives T+2 to T+7** and needs a separate Settlement Recon backfill job. `RevenueEvent` reserves the fields; the backfill is deliberately out of scope for this PR series.
4. **Currency exponents for HUF and COP are unverified** (MUST-ASK #6). A mismatch is a 100× overcharge on an auto-captured payment. Gate this before any *new* non-INR currency goes live, independent of coupons.

---

## 6. Blast radius and rollback

Every change touching code money currently flows through, and its independent rollback:

| # | Change | Touches live money? | Rollback |
|---|---|---|---|
| 1 | `create:264` Purchase reuse guard | Yes — the reuse decision on every subscription checkout | `git revert`. Behaviour returns to today's. Independently revertible; strict improvement with the flag off. |
| 2 | `create:162-164` null → mismatch + backfill | Yes — the reuse-identity decision | `git revert`. The backfill is additive (fills nulls with the correct catalog price) and does not need undoing. |
| 3a | Reconciler `providerCancellationPending` sweep | Yes — cancels provider subscriptions | `git revert`. Adds cancellations only for rows already flagged as needing one. |
| 3b | Atomic `providerPlans` write | Yes — plan resolution | `git revert`. Same reads, narrower write. |
| 4 | `Purchase.amountPaise` currency-aware min | Yes — Purchase insert validation | `git revert`. Strictly widens some currencies, narrows others; no data change. |
| 5 | New collections + **additive, defaulted** fields on `Purchase`/`Subscription` | No — nothing reads them yet | Leave in place. Additive fields with defaults are always safe; **never** revert a schema addition that already has rows. |
| 6 | Widened `fetchRazorpayPayment` type | No — type-only | `git revert`. |
| 8 | `resolveChargedProduct` + the seven `create` call sites | **Yes — this is the discount itself** | **Feature flag `SUBSCRIPTION_DISCOUNT_ENABLED=false` makes `resolveChargedProduct` the identity function.** With the flag off, `chargedProduct === pricedProduct` and every downstream line is provably byte-identical to today. Flag flip is the rollback; code revert is the fallback. |
| 9 | `verify` redemption confirm + `RevenueEvent` write | Yes — but strictly **after** the money decision and inside a try/catch that never fails verification | `git revert`, or just stop reading the rows. |
| 10 | Release hooks in `create` and the reconciler | Yes — the reconciler's failure branches | Each hook is a `no-op` when no `CouponRedemption` exists, which is every subscription created before the flag was enabled. |
| 11 | `RevenueEvent` write on the renewal path | Yes — inside the `subscription.charged` handler | Wrap in try/catch so a ledger failure cannot 500 the webhook (a 500 makes Razorpay retry until it gives up, which is exactly how five `subscription.cancelled` events were permanently lost). `git revert`. |
| 12 | Four cron additions | Yes — the daily recovery batch | Each is a separate entry in the existing `Promise.allSettled` at `route.ts:59-68`, so one failing cannot discard the others. Remove individually. |

**The half-discounted-subscriber problem, stated plainly.** Turning the flag off stops **new** discounted subscriptions. It does **nothing** to subscriptions already created: they are bound at Razorpay to a discounted plan id, and §2 established that no cohort's plan amount can be raised (UPI 400, emandate 400, domestic cards offer-only, offers international-excluded). Under mechanism G *described as a first-month discount*, that population would be a permanent, unfixable mess. **Under J it is not a mess — it is the product working as designed.** That is the single strongest argument for shipping G *as* J rather than as G: it is the only option whose rollback story is true.

The plan-cache key at `:238` is the natural blast-radius container. A discounted plan lives at a **different** cache key, so full-price customers keep resolving the full-price plan id with byte-identical behaviour, forever, regardless of what happens to the coupon feature.

---

## 7. Royalty-readiness

**State this to the founder without softening it: subscription renewals currently create no `Purchase` row and no money figure anywhere durable.** `applySubscriptionCycleCredits` (`lib/billing/db.ts:875-952`) takes `{subscription, cycleKey, paymentId}` — no amount, no currency — and writes four collections (`CreditLedger`, `Subscription`, `UserBilling`, legacy user credits), none of which has a money field. `app/api/billing/history/route.ts` already concedes it in a comment: *"no local money record exists, so report the credits delivered rather than inventing an amount."* A royalty run against `Purchase` today would underpay partners by roughly **11/12** on monthly subscription revenue, and by `(n-1)/n` on an n-year annual subscriber. **This is true at full price, with no coupon anywhere in the codebase.** Constraint 4 is not something a discount mechanism breaks; it is already broken, and no discount mechanism fixes it.

Build **now**, in the same PR series, so nothing is migrated twice:

1. **`RevenueEvent`** (Step 5e) written from **all four** money paths: `checkout/verify`, `subscriptions/verify` (Step 9), `webhooks.ts` `invoice.paid`/`subscription.charged` (Step 11), and `subscription-cycle-reconciliation.ts` (Step 11). Unique `providerPaymentId` makes every writer idempotent.
2. **Attribution capture from day one** — `attributionKey` on `Purchase` and `RevenueEvent`, populated at checkout even though no partner exists. Amounts, fees and FX can all be re-derived from Razorpay later. **Who referred the customer cannot.** This is the only irreversible omission.
3. **Gross / discount / net as three separate stored numbers** (`listAmountSubunits`, `discountAmountSubunits`, `chargedAmountSubunits`). A partner statement must be able to show *why* net differs from list without re-deriving it.
4. **FX basis, explicitly labelled.** Store `baseAmountSubunits`/`baseCurrency` from the payment entity, plus `fxBasis ∈ {provider_base_amount, static_table, unknown}`. Razorpay confirms *"Settlements are always made in INR. The payment is converted using the exchange rate at the time of payment creation."* Our `basePriceInr` comes from a hardcoded table at `lib/billing/regional-pricing.ts` — it is a **catalog anchor, not revenue**. Rename it `listPriceInr` (Step 6) so no future engineer wires it into a payout.
5. **Provider fee and tax** — `payment.fee` (*"Fee (including GST) charged by Razorpay"*) and `payment.tax`, plus `netToMerchantSubunits`. The **royalty basis** (gross / net-of-fees / net-of-fees-and-tax) differs by 3–5 percentage points and varies by method and currency; snapshot `royaltyBasis` and `royaltyRateBps` **on the row**, or the first fee change silently rewrites every historical statement.
6. **Tax treatment.** `lib/billing/catalog.ts` stores bare `priceInr` integers with no inclusive/exclusive marker, and `Purchase` has no tax field. Decide it now and store `taxableAmountSubunits`/`outputTaxSubunits`/`priceIsTaxInclusive` per transaction. Paying a partner on a GST-inclusive gross overpays by the GST fraction on every Indian transaction.
7. **Settlement linkage fields reserved** (`settlementId`, `settledAt`, `settlementStatus`) for a later T+2..T+7 backfill. Royalty accrual must be two-phase: provisional at capture, final at settlement.
8. **Remove or greatly lengthen the 180-day TTL** on `RazorpayEventLog` (`models/razorpayEventLog.ts`), which is currently the *only* place a renewal's amount exists — and even it does not carry `base_amount`, so non-INR renewal revenue in INR terms is unrecoverable from it at any point.
9. **Refund model:** add `currency` to `models/refund.ts` and make the parent reference able to point at a `RevenueEvent`, so a refunded renewal is expressible (Step 5, §5 gap).
10. **Razorpay Route cannot be used** — its FAQ says INR-only, and no transfers on international-currency orders. The royalty ledger is ours alone, with out-of-band payouts and no provider-side cross-check. That raises, not lowers, the bar on these records.

---

## 8. Rollout with go/no-go gates

**Gate 1 — Hardening only, no feature. Merge and soak 48h.**
Steps 1, 2, 3, 4. No coupon code exists anywhere.
**Go criteria:** an ordinary full-price subscription checkout completes end to end on staging; the daily cron completes green twice consecutively; zero new `409`s in production logs; `reconcileStalePendingSubscriptions` reports `expired: 0` beyond baseline.
**No-go:** any increase in `checkout_attempt_expired` or `subscription_already_in_progress` — that means the new Purchase-reuse guard is rejecting legitimate retries and the age/status predicate needs widening before anything else ships.

**Gate 2 — Schema and plumbing, dead code. Merge.**
Steps 5, 6, 11 (`RevenueEvent` writers on all four paths), 12. Renewal revenue capture is live **at full price**, before any discount exists.
**Go:** a real renewal (or a replayed `subscription.charged` on staging) produces exactly one `RevenueEvent` with the correct amount and currency; a redelivered duplicate produces none; `history` output is unchanged; the backfill script reconciles historical invoices with zero duplicates.
**No-go:** any duplicate `RevenueEvent`, or a webhook 500. A 500 makes Razorpay retry until it gives up — that is how five `subscription.cancelled` events were permanently lost.

**Gate 3 — REACH `captured` ONCE, AT FULL PRICE, WITH A REAL CARD. This is the hard gate.**
No purchase has ever reached `captured` in production. **The first discounted checkout must not also be the first real exercise of `verify:73-76`.** Do one live full-price subscription on a real card, on a real device.
**Go:** `payment.status === "captured"`; `Number(payment.amount) === purchase.amountPaise` **exactly**; `purchase.status === "captured"`; `notes.clientSubscriptionConfirmation` present; credits granted exactly once; `RevenueEvent` written; the next 04:00 cron leaves the subscription alone. Then refund it and confirm `recordRefundAdjustment` reverses 100% of credits.
**NO-GO — STOP THE ENTIRE PROGRAMME:** if `payment.amount` is not the plan amount, or arrives in the settlement currency rather than the presentment currency. **The problem is `verify`, not the discount** — and under G/J the discount provably cannot be the cause, which is precisely why G/J is the right vehicle for finding out. Escalate MUST-ASK #3 and #4 to Razorpay before writing another line.

**Gate 4 — Discount engine merged with `SUBSCRIPTION_DISCOUNT_ENABLED=false`.**
Steps 8, 9, 10.
**Go:** with the flag off, `resolveChargedProduct` is the identity function and a full-price checkout is byte-identical — verify by diffing the created Razorpay plan id, `purchase.amountPaise` and `subscription.amountSubunits` against a pre-merge run. No behavioural diff anywhere.

**Gate 5 — ONE code, INR only, ONE monthly product (`sub_month_1`), internal staff only.**
`maxRedemptions: 5`, `validUntil` = +7 days, allowlisted to staff user ids.

> ### THE MANUAL END-TO-END TEST THAT MUST PASS BEFORE A SECOND CODE IS ENABLED
> Run every step on a **real device against production**, with a **real Indian card** and then repeated with **UPI AutoPay**. Do not substitute test mode — test-mode card tokens are valid for 3 days and cannot exercise a real renewal.
>
> 1. Open `/billing` with no code. Confirm the displayed price is ₹149.
> 2. Enter the code. Confirm the displayed price becomes ₹127 (`Math.round(14900 × 0.85) = 12665`, i.e. ₹126.65) and that the Razorpay sheet opens showing **that** amount.
> 3. **Dismiss the sheet without paying.** Reopen with the **same** code → the same subscription id and the same purchase id come back, no 409. Reopen with **no** code → a clean reclaim, a **new** full-price subscription, the first provider subscription cancelled at Razorpay, and the redemption released (`Coupon.redemptionCount` back to its prior value).
> 4. Re-enter the code and **pay**. Confirm, server-side: `payment.amount === 12665`; `payment.currency === "INR"`; `payment.status === "captured"`; `purchase.amountPaise === 12665`; `purchase.listAmountSubunits === 14900`; `purchase.discountAmountSubunits === 2235`; `purchase.status === "captured"`; `notes.clientSubscriptionConfirmation` present; `subscription.amountSubunits === 12665`; `subscription.listAmountSubunits === 14900`; `CouponRedemption.state === "confirmed"`; exactly **one** `CreditLedger` row granting **150** credits; exactly **one** `RevenueEvent` with `kind: "subscription_initial"`.
> 5. Confirm the UI reaches "Subscription confirmed. Entitlements updated." — **not** the "Entitlement sync is pending" fallback at `billing-client.tsx:558`.
> 6. Attempt to redeem the **same** code again as the same user → `409 coupon_already_redeemed`. Attempt a **different** code as the same user → also `409` (the one-promotional-redemption-per-user index).
> 7. **Wait for the 04:00 cron. Confirm the subscription is still active and was not cancelled**, and that the drift detector does **not** flag it (because `couponCode` is set).
> 8. **Wait for the real cycle-2 renewal** (~30 days, or use a Razorpay test-mode charge to force it). Confirm the debit is **₹126.65 again, not ₹149**, that it succeeds, that credits are granted exactly once, and that a second `RevenueEvent` with `kind: "subscription_renewal"` carrying the amount and currency exists. **This is the step that proves the perpetual-discount trade is real and that the mandate is honouring the discounted plan.**
> 9. Refund the first payment in full. Confirm all 150 credits are reversed and `purchase.status === "refunded"`.
> 10. Repeat 1–7 with **UPI AutoPay**, and 1–7 once with a **USD** price on an international card (the live USD subscriber's tier), confirming `payment.currency === "USD"` and `payment.amount` equals the discounted USD subunits **exactly** — no `base_amount` substitution.
>
> **Any single failure blocks the second code.** Step 8 in particular cannot be skipped or simulated away: it is the only proof that the discounted plan renews at the discounted amount rather than failing, and it is the whole basis of the trade the founder is being asked to accept.

**Gate 6 — Public launch: one code, hard `validUntil`, global `maxRedemptions` sized so that `maxRedemptions × discount × ARPU × expected_lifetime_in_cycles` is a number the founder has signed off on in writing.** Copy must say *"member rate, locked in while you stay subscribed"* — **never** *"first month."*

**Gate 7 — Non-INR enablement.** Blocked on MUST-ASK #5 (which currencies are enabled on our merchant ID) and #6 (authoritative exponent list, asserted in a unit test). Do not enable a coupon in a currency whose exponent we have not confirmed with Razorpay: a mismatch is a 100× overcharge on an auto-captured payment.

---

**Where genuine uncertainty remains:** whether `payment.amount` on an immediate-start subscription authorisation always equals the plan amount across all four payment methods (gate 3 settles it empirically in a day; MUST-ASK #3 settles it in writing); whether the creation-time `addons` key is alive (gates H, not J); the exact mandate ceiling derivation for card subscriptions (irrelevant to J because the price never rises, decisive the moment anyone proposes restoring full price); and the currency exponents for HUF and COP. Everything else in this plan is either cited above or was read line by line in the repository.