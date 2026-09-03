# Verifying the discount-code flow

What the flow is, how to check each leg of it yourself, and what has to be done by a human before
any of it works in production.

The path is:

```
Figma plugin credit modal  ->  POST /api/billing/checkout/bridge  ->  GET .../bridge/exchange
   -> /billing?coupon=CODE  ->  Razorpay  ->  Order complete receipt
```

---

## Before it can work at all

These are database and dashboard steps. Nothing below works until they are done.

### 1. The codes must exist, and must be switched on

`scripts/seed-coupons.ts` creates all four codes with `active: false` and deliberately never flips
that flag, so re-seeding cannot silently re-enable a code someone turned off. Until this change
there was no way to turn one on - the feature could be deployed and still reject every discount.

```bash
npm run seed:coupons -- --apply
```

```bash
npm run coupon:activate -- BOOST20
```

That is a dry run: it prints the before/after state, the percent, and how many redemptions already
exist. Nothing is written without `--apply`:

```bash
npm run coupon:activate -- BOOST20 --apply
```

Turning one back off:

```bash
npm run coupon:activate -- BOOST20 --off --apply
```

Start with **one** code, prove a real discounted subscription reaches `status: "captured"` with the
right `razorpayPaymentId`, then enable the rest.

### 2. Razorpay dashboard webhook events

Confirm the endpoint subscribes all of: `payment.captured`, `order.paid`, `invoice.paid`,
`subscription.charged`, `subscription.authenticated`, `subscription.cancelled`, `refund.processed`,
`payment.refunded`.

Worth checking specifically whether `invoice.paid` was ever enabled - the event history shows zero
deliveries of it. The settlement path no longer depends on it (`payment.captured` now grants the
cycle inline), but if it is not subscribed, renewals have no delivery path other than the nightly
reconciler.

### 3. Deploy order

Deploy the **website first**, then publish the plugin.

The website changes are backward compatible with the plugin currently in the wild - it sends no
`couponCode` and the field is optional. The reverse is not true: a plugin that sends a code to a
website that cannot read it drops the discount silently.

---

## Checking it locally

```bash
npm run dev
```

### The checkout card

    http://localhost:3000/billing/checkout-preview

Runs the real `BillingClient` against stubbed billing responses - the same component that ships, only
the network is faked. Anything that would move money is refused rather than simulated.

- `?coupon=BOOST20` - a code arriving with **no product named**. It must land on a *subscription*,
  not a top-up, auto-apply, and read `BOOST20 applied - 20% off / $4.80 for your first month, then
  $6.00`. This is the case the plugin produces, and it used to land on a 100-credit top-up and say
  "that code cannot be applied".
- Click **"Just need credits instead? See credit top-ups"** - the rejection must now be *visible*
  ("BOOST20 applies to subscription plans, not credit top-ups") with a "Remove code and continue"
  escape. It was previously rendered only inside the subscription-only banner, so it appeared
  nowhere.
- `?nodetails=1` then press **Continue to Razorpay** - the Billing Information modal must open and
  Razorpay must NOT. `/pricing` always gated on this; `/billing` never did, and it is now a direct
  entry point.

### The receipt

    http://localhost:3000/billing/receipt-preview
    http://localhost:3000/billing/receipt-preview?discount=1

The paper feeds out of the slot in the card above it. The discounted variant is longer and must feed
all the way out, showing the coupon line, the reduced total, and the recurring price.

Both preview routes return **404** in production. Verify:

```bash
npm run build && NODE_ENV=production npx next start -p 3111
curl -o /dev/null -w '%{http_code}\n' http://localhost:3111/billing/receipt-preview   # 404
```

### The claim links

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/claim/BOOST20
```

Expect `307 .../billing?coupon=BOOST20`. A malformed code is dropped rather than reflected into the
redirect; `?product=` and `?autostart=` are carried, anything else is stripped.

---

## Checking the plugin leg

```bash
cd ../merged-plugin-main
npm run use:prod && npm run build && npm test
```

`ui.bundle.html` is generated and is what Figma actually loads - editing `ui-scripts/**` alone ships
nothing. The bundle is marked `linguist-generated` so it collapses in review; check the sources.

In the plugin, with the dashboard open:

1. Spend down to each threshold and confirm the modal offers the code the **server** will honour:
   0 credits -> UNLOCK30, up to 25 -> TOPUP25, up to 50 -> BOOST20, above -> WELCOME15. These used to
   be 0 / under-50 / under-75, so everyone between 26-49 and 51-74 was shown a discount and then
   refused at checkout.
2. Press **Claim Now**. The browser must open on `/billing` with the code applied and priced - not
   `/pricing`, and not full price.
3. Press the **code chip** to copy. It must only say "Copied" when something was actually copied.
   Figma's iframe has the Clipboard API but denies it, and the old fallback only ran when the API was
   *absent*, so it never ran and the label lied.
4. Kill your network and press Claim Now. The fallback must open `/claim/<CODE>`, not the bare
   pricing page - all three fallback branches used to drop the discount.

---

## Automated checks

```bash
npm test              # 249 tests
npm run typecheck
npm run build
```

Coupon-specific:

```bash
npm run test:coupons
```

The money-path tests worth knowing about:

| File | Covers |
|---|---|
| `test/coupon-plugin-bridge.test.ts` | the code survives the plugin hand-off; autostart is never armed by the bridge; the billing-details gate; the ladder ceilings the plugin mirrors |
| `test/coupon-redemption-integrity.test.ts` | reserve/release/claim against a real MongoDB with real unique indexes |
| `test/coupon-lifecycle.test.ts` | every path that ends a checkout also frees the code |
| `test/coupon-discount.test.ts` | the discount arithmetic |
| `test/plan-savings.test.ts` | the yearly "N% OFF" badge can never overstate |
| `test/coupon-code-shape.test.ts` | what is and is not a code, at every untrusted entry point |

---

## After the first real sale

- Watch the `n4-product-recall` cron output for `missingDeliveries` and purchase-reconciliation
  failures.
- Check the purchase reached `status: "captured"` with `grantApplied: true` and exactly **one**
  credit-ledger row for the cycle. Two rows for one payment is the double-grant this change closed.
- Check the `CouponRedemption` row is `redeemed`, not `released`. A released row after a successful
  payment means the customer can take the discount again.
