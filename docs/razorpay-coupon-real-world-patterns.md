## What teams actually do

Ranked by how much real evidence supports each. I verified the load-bearing documentation myself rather than inheriting it; where a claim rests on one weak repo I say so.

---

### 1. Mint a Razorpay Plan whose amount *is* the discounted price, cached by (amount, currency, period, interval)

**Evidence: real implementation — and it is Razorpay's own code.**

Razorpay's official WooCommerce Subscriptions plugin never looks up a pre-made plan. I fetched the source and confirmed every line:

`https://github.com/razorpay/razorpay-woocommerce-subscriptions/blob/master/includes/razorpay-subscriptions.php`

```php
$recurringFee = $sub->get_total();          // getPlanArguments()
'amount' => (int) round($recurringFee * 100)

$hashInput = implode('|', [                  // getKeyFromPlanArgs()
    $item['amount'], $item['currency'],
    $planArgs['period'], $planArgs['interval']
]);
return self::RAZORPAY_PLAN_ID . sha1($hashInput);
```

`createOrGetPlanId()` looks that key up in product post_meta, verifies the stored plan's amount still matches, and calls `$this->api->plan->create($planArgs)` on a miss.

The critical detail, which I confirmed by grepping the repo: **the word "coupon" does not appear anywhere in that file.** That is not a gap — it is the architecture. WooCommerce has already applied the coupon to the recurring total by the time Razorpay is called. The discount is resolved *before* a Razorpay object exists, so Razorpay only ever sees a price. That is the whole pattern in one sentence.

Three further codebases converge on the identical shape — an amount→plan_id lookup table:

- `https://github.com/TheDonCaprio/saasybase/blob/main/app/api/checkout/route.ts` — cache key includes `couponUpdatedAtMs`, plus a real mint lock (`tryAcquireDiscountedSubscriptionPriceKey` and an 8×200ms wait-for-peer loop) so concurrent checkouts don't mint duplicate plans.
- `https://github.com/digibranders/oye-chats-platform/blob/main/api/app/services/razorpay_service.py` — `DiscountedPlanCache` keyed on `(base_plan_id, billing_cycle, discount_bps, currency)`, with `MIN_DISCOUNTED_PLAN_PAISE = 100` so a large percentage can't produce a near-zero recurring charge. Its in-code comment states the reason plainly: *"Razorpay Offers have no create API, so recurring discounts are modelled as discounted plans."*
- `https://github.com/mitanshu610/wayne/blob/main/plans/services.py` — `create_discounted_plan_if_needed()`, creating a plan literally named `"{plan.name} (Discounted)"`.

**Honest evidence weighting.** The Razorpay-authored instance is genuine but low-adoption: `razorpay-subscriptions-for-woocommerce` reports ~700 active installs and 7 GitHub stars, and is a separate plugin from the 2.4M-download `razorpay-woocommerce` gateway. The other three are 0–6 star repos created in 2025–2026, several with strong machine-generated signatures. They may have converged because they were generated against the same public docs you already read. So: **the pattern is definitely implementable and Razorpay ships it themselves; it is not demonstrably an industry consensus.**

An earlier research pass concluded "nobody ships plan-per-discount-tier" based on two GitHub code searches returning zero. That null result is wrong — the pattern has no searchable signature (it looks like ordinary plan-id selection), and Razorpay's own plugin does it. Discard that finding.

**Cost.** The discount is permanent for the life of that subscription. The plan amount is frozen (`https://razorpay.com/docs/payments/subscriptions/create-plans/`: *"Once a Plan is created, you cannot edit or delete it."*) and you cannot swap the plan later for UPI or eMandate customers. Plan objects accumulate without bound — one per price point ever seen, per currency, per cycle. You need concurrency control on minting (only one of the four codebases has it). And two of these codebases record `plans.create` throwing an uncaught 401 on accounts not provisioned for the Subscriptions product, in one case crashing a webhook handler and causing six Razorpay retries with the purchase stuck.

---

### 2. Accept permanence explicitly, and encode it in the product

**Evidence: real implementation + vendor product copy.**

saasybase's checkout rejects any non-lifetime coupon on Razorpay with a 400:

> *"Razorpay: implement subscription discounts by creating a discounted plan_id dynamically. This is only correct for FOREVER coupons (lifetime discount), because plan-based subscriptions have fixed pricing."* — `app/api/checkout/route.ts`

A commercial WordPress gateway states it as a *feature*, not a caveat: *"RazorPay Pro support coupons only for one-time payment membership or entire billing period on subscriptions."* (`https://store.wpindeed.com/addon/razorpay-pro-payment-gateway/`)

**This is the answer to your first question — yes, teams accept a permanent discount, and they ship the acceptance as a guard rail rather than trying to engineer around it.**

---

### 3. Native `offer_id`, with the Offer hand-created in the Dashboard

**Evidence: real implementation (thin) + vendor docs (strong).**

The shipped shape everywhere: the coupon code lives in the merchant's own database, all eligibility logic runs server-side, and the only thing crossing to Razorpay is an `offer_id` string.

- `https://github.com/bhargav465/restropulse/blob/master/apps/api/src/routes/subscriptions.ts` — a coupon row carries `razorpayOfferId`, resolved only after local checks on status, expiry, max redemptions and plan applicability.
- `https://github.com/MGI-1/payment_gateway/blob/main/payment_gateway/providers/razorpay_provider.py` — `create_subscription_with_specific_offer(...)`.
- saasybase treats it as second-class: env-gated behind `RAZORPAY_ENABLE_OFFERS`, shape-validated against `/^offer_[A-Za-z0-9]+$/`, and wrapped in a delete-the-field-and-retry fallback.

**One important correction to the brief you were given.** Offers do **not** force a permanent discount. I verified `https://razorpay.com/docs/payments/subscriptions/offers/create/` directly: redemption types are **Single Use**, **Limited number of cycles**, and **Forever**. So in INR, a "15% off for the first 3 cycles" discount is natively expressible with no discounted plan and no cancel-and-recreate.

**But the coverage constraints stack, and all four are verbatim from Razorpay:**

| Constraint | Source |
|---|---|
| *"We do not support offers on international currency and the CFB (Customer Fee Bearer) model."* | `https://razorpay.com/docs/payments/offers/` |
| *"You can create offers only from the Dashboard."* — no create API | `https://razorpay.com/docs/payments/subscriptions/offers/create/` |
| Applicable payment methods are **UPI and Card only** | same page ("Applicable On" tab) |
| *"Offers for Subscriptions are only available when using Razorpay Standard Checkout."* | `https://razorpay.com/docs/payments/subscriptions/offers/link/` |

Offers therefore fail your stated requirement on three independent axes simultaneously. That stacked constraint set — not any single limit — is why nobody found using them as a general coupon system.

---

### 4. Abandon Razorpay Subscriptions; register a mandate with headroom and charge a merchant-computed amount each cycle

**Evidence: real implementation (Odoo, Chargebee's own tutorial) — but it does NOT solve multi-currency.**

This is what every commercial billing platform actually does. Chargebee's own integration tutorial calls exactly two Razorpay endpoints — `POST /v1/customers` and `POST /v1/orders` with a token block `{max_amount, expire_at, frequency}` — then passes `razorpay_payment_id` to Chargebee as `payment_intent[gw_token]`. **No `plan_id`, no `subscription_id`, no `/v1/subscriptions` anywhere in the flow** (`https://www.chargebee.com/tutorials/razorpay-js-integration-with-chargebee-api/`).

Odoo core ships the same shape in production:

`https://github.com/odoo/odoo/blob/master/addons/payment_razorpay/models/payment_transaction.py`
```python
{'max_amount': ..., 'expire_at': today + 10 years, 'frequency': 'as_presented'}
_razorpay_get_mandate_max_amount():
    min(pm_max_amount, max(mandate_values['amount'] * 1.5, mandate_values['MRR'] * 5))
```

Odoo deliberately sizes the mandate ceiling *above* the order total — 1.5× the order or 5× MRR — precisely to leave room to charge more later. Paddle documents the same design rule outright: the UPI e-mandate is *"calculated from the non-discounted recurring amount"*, decreases work automatically, increases fail into `past_due` (`https://developer.paddle.com/concepts/payment-methods/upi/`).

More instances of hand-rolled token charging: `https://github.com/flexprice/flexprice/blob/main/internal/integration/razorpay/mandate.go`, `https://github.com/frappe/iff/blob/master/iff/jobs/daily.py` (with the comment *"Razorpay python does not have recurrig payments yet"*), and `https://github.com/BeamLabEU/phoenix_kit_billing/blob/main/lib/phoenix_kit_billing/providers/razorpay.ex`.

**Why this is not your answer.** I verified `https://razorpay.com/docs/api/payments/recurring-payments/cards/create-subsequent-payments/`: the recurring payment `currency` field reads *"3-letter ISO currency code for the payment. Currently, only `INR` is allowed."* Same on the UPI equivalent. So charge-at-will gives you total price control and **zero** currency coverage. Every codebase in this category is INR-hardcoded, including Frappe's literal `"currency": "INR"`.

You also inherit the entire billing engine: scheduler, dunning, retries, invoices, proration, mandate lifecycle, and idempotency (Razorpay will execute a duplicate recurring charge if you call twice — there is no server-side guard). Plus UPI subsequent debits are asynchronous, 24–36 hours, and you must not issue another charge until the previous settles.

---

### 5. Sidestep the coupon moment entirely — discount by billing term, or make it a one-time Order

**Evidence: real implementation, at overwhelming volume.**

GitHub code search: `razorpay coupon orders.create discount language:javascript` → **2,336 files**. `"discounted plan" razorpay coupon` → **25 files**. The ecosystem's default answer to "coupon on Razorpay" is "make it a one-time purchase, compute the discount server-side, call `orders.create` with the final amount." That works in every currency and every payment method — because it isn't a subscription.

For recurring, the visible pattern on live Indian SaaS pricing pages is term-based discounting: Interakt shows *"Save 8% on Quarterly" / "Save 20% on Yearly"* (`https://interakt.shop/pricing/`), AiSensy shows *"SAVE 5%" / "SAVE 10%"* with a **separate USD pricing page** rather than a currency switch (`https://www.aisensy.com/pricing`). Neither exposes a promo field. Caveat: these are marketing pages, not observed checkouts, and I could not confirm either company's own billing runs on Razorpay Subscriptions — Razorpay appears on both sites as an integration they offer *their* customers. Treat as suggestive, not proof.

And some integrations simply decline: *"The LearnDash Razorpay integration does not allow you to offer discounts."* (`https://docs.nexcess.com/software/learndash/razorpay-integration/`)

---

## What nobody appears to do

These are searched-for-and-not-found. Several are genuinely informative.

**Create a discounted plan for cycle 1, then cancel and resubscribe at full price.** No evidence, anywhere. The cancel-and-recreate primitive exists and is used — `https://github.com/zore1803/DataCircles-DEV/blob/main/backend/controllers/subscriptionController.js` has `// UPI cancel-and-recreate: only for upgrades/billing-cycle changes, never downgrades.` — but exclusively for **user-initiated upgrades**, never as a discount-expiry mechanism. The reason is structural: cancelling kills the mandate, so the customer must complete a fresh authorisation and the subscription sits unpaid until they do. It converts a renewal into a re-acquisition, at exactly the moment you are raising their price. Nobody does this silently because it *cannot* be done silently.

**Discount a subscription in a non-INR currency, by any mechanism.** Every codebase examined is INR-only. The one repo with an explicit USD rail (`oye-chats-platform`) documents in its own files that International Cards are not enabled on the account and PayPal *"does not support subscriptions"* — its USD rail has never processed a live recurring charge. Its docs also record a real operational scar: *"An 'INR-only' re-price has twice silently invalidated USD plans."*

**Any Offers *create* API usage.** It doesn't exist. Confirmed in Razorpay's docs and echoed in production code comments. Four percentage tiers means four hand-made Dashboard objects, forever.

**Any open-source code putting Chargebee/Zoho/Recurly/Chargify in front of Razorpay.** Zero repositories. Only vendor documentation. And the vendor route does not rescue multi-currency: Zoho states *"Currently, Zoho Billing supports only INR (Indian Rupees) for Razorpay"* (`https://www.zoho.com/us/billing/kb/payment-gateways/razorpay-currency-support.html`), and Chargebee's documented fallback for non-INR customers is *"payments can only be collected by sending out a Pay Now link through email."* Recurly and Maxio/Chargify don't support Razorpay at all (`https://docs.recurly.com/recurly-subscriptions/docs/payment-gateways-1`, `https://www.maxio.com/payment-gateways`), so the shortlist is two names, not six.

**Coupons run off-platform as post-hoc refunds or manual credits.** No evidence in any repo. Weak absence — this would live in support macros and ops runbooks, not source control. You rejected it anyway.

**A deliberate "annual plans only" or "first-purchase only" discount policy articulated as a Razorpay workaround.** Commercially common; not evidenced as a Razorpay-driven decision anywhere.

**Any Razorpay-hosted public developer forum.** None exists. Razorpay routes developer questions to private support tickets, which is why practitioner knowledge here surfaces as in-code comments rather than searchable threads.

**Coverage gap I should flag honestly:** Stack Overflow and Reddit were not usefully reachable across the research passes. The "workarounds teams admit to on forums" channel is genuinely under-sampled. My evidence base is documentation, source code, and pricing pages — not confessions. A manual Stack Overflow search before you commit is worth twenty minutes.

---

## Why Razorpay makes this hard

Razorpay models a subscription as an immutable Plan plus a bank mandate registered against that plan's amount, so the *price* is frozen into two objects at signup rather than computed per cycle. Its only price-cut primitive, Offers, is Dashboard-created, UPI-and-Card-only, and explicitly excluded from international currency (*"We do not support offers on international currency and the CFB (Customer Fee Bearer) model."*), while Add-Ons are deprecated (*"You are unable to use the Add-Ons feature since it is deprecated."*) and plan updates are blocked for everyone except card users (*"You can only update a Subscription authorised using cards and not via UPI and Emandate."*). The result: the only lever that works in every currency and on every payment method is the plan amount itself — and that lever, once pulled, cannot be pulled back.

---

## What this means for Waysorted specifically

**First, the uncomfortable thing.** No purchase has ever reached `captured`. Coupons are a pricing feature layered on a payment flow that has not yet successfully taken money from anyone. Every hour spent on discount architecture before capture works is spent on a system with no demonstrated success path. Fix capture first — and specifically verify that Plans and Subscriptions are actually *entitled* on your account, because two independent codebases in this research hit hard `401 Unauthorized` from `plans.create` / `subscriptions.create` on live accounts that had payments enabled but not the Subscriptions product. That is a five-minute API test and it may explain more than you expect.

**Second, the requirement should change — but not the part you'd guess.**

You asked for four percentage codes, every currency, every payment method, price genuinely reduced. The dynamic-discounted-plan pattern delivers *all four of those*. What it cannot deliver is the fifth, unstated requirement: that the discount ends. Drop that one and the problem is solved. Keep it and you are choosing between an INR-only Offers path and building a billing engine.

Given one USD subscriber and ~72 INR wallets, "every currency" is aspiration rather than demand today — but you don't need to give it up, because the plan-minting approach is currency-agnostic by construction (each currency simply gets its own cached plan; `https://razorpay.com/docs/payments/subscriptions/create-plans/` — *"Create the plan in the currency you want to charge the customer."*).

**Recommendation: dynamic discounted-plan minting, with permanence made explicit in the product.**

Concretely:

1. Coupon codes live entirely in your database. Razorpay never sees a code. All validation — expiry, max redemptions, per-customer-once, plan applicability — is server-side, and redemption is recorded only on the `subscription.activated` / `subscription.charged` webhook, not at click time.
2. At checkout, compute `discounted_amount = base_amount - floor(base_amount * bps / 10000)`. Look up a cache row keyed on `(base_plan_id, currency, period, interval, discount_bps)`. On miss, `plans.create` at the discounted amount and store the id. This is Razorpay's own plugin's design with currency and discount tier added to the key.
3. Take a lock around the mint. saasybase is the only one of four codebases that does this, and it's the difference between one plan per tier and orphaned plans accumulating on every concurrent checkout.
4. Enforce a minimum discounted amount (oye-chats uses ₹1 / 100 paise). 30% off a low tier in a weak currency should not produce a sub-unit recurring charge.
5. Wrap `plans.create` so it can never throw out of a webhook handler. The recorded failure mode is Razorpay retrying six times while the purchase stays stuck forever.
6. **Assert that the amount Razorpay actually charged equals the amount the customer was shown.** Two separate teams shipped discount bugs where the UI showed a discount Razorpay never applied and the customer paid full price. That class of bug fails silently and in your favour, which means you will hear about it from a customer, not from your monitoring.

**Position the codes as what they structurally are: founding-member lifetime pricing.** "25% off for life, first 100 subscribers" is a stronger offer than "25% off your first month," costs you the same engineering, and is honest about a constraint you cannot escape. Trying to build an expiring discount is where the cost explodes.

**If you later need expiring discounts in INR specifically**, Dashboard Offers with redemption type "Limited number of cycles" do this natively — four hand-made Offers, `offer_id` passed at `subscriptions.create`. But that's a second code path, INR-only, UPI-and-Card-only, Standard-Checkout-only. At 72 wallets, a second code path is not worth it. Revisit at 10×.

**On the influencer royalty system** — this actually argues *for* the plan-minting approach. The discounted plan id encodes the tier, and the `subscription.charged` webhook carries `plan_id`, so attribution is clean without extra state. But decide now, before you launch: a permanently discounted price means a permanently reduced royalty base. Whether the influencer earns on list price or on collected price is a business decision that gets much harder to change once codes are in the wild.

**Unrelated but urgent:** `Waysorted-s-Organisation/waysorted-web` is public (`"private": false, "visibility": "public"`), and `docs/coupon-codes-implementation-plan.md` fetches with HTTP 200 from `raw.githubusercontent.com` on both `main` and `master` with no credentials. Your internal billing design is publicly readable. I did not read the file's contents, only confirmed it is retrievable — check what else in `docs/` is exposed the same way, and whether any of it contains key ids, plan ids, webhook secrets, or account identifiers.

---

## The decision, stated plainly

Ship the four codes as **permanent percentage discounts implemented as dynamically minted Razorpay Plans**, cached by `(base_plan, currency, period, interval, discount_bps)` — this is what Razorpay's own WooCommerce plugin does, it works in every currency and on every payment method, and it is the only pattern that does. Accept that the discount never expires and sell it as founding-member lifetime pricing rather than fighting a constraint that has no evidenced workaround. But do none of this until a real payment reaches `captured` and you have confirmed via a direct API call that Plans and Subscriptions are actually entitled on your account — two teams in this research discovered they weren't, the hard way, from a 401 inside a webhook handler.