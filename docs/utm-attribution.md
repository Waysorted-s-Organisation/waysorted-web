# Checkout UTM attribution

Use standard UTM query parameters on any Waysorted landing page. The latest tagged visit is kept
for 30 days and attached to the next one-time or subscription purchase created in that browser.

Example link for Madhura:

```text
https://www.waysorted.com/payment?utm_source=madhura&utm_medium=referral&utm_campaign=checkout
```

Attribution is stored on the `Purchase.attribution` object and copied into the Razorpay order or
subscription notes. It is informational analytics data and must not be used as authorization or as
the source of pricing or credit decisions.

An administrator can inspect purchases attributed to this source with:

```text
GET /api/admin/billing/purchases?utm_source=madhura
```

The response includes all matching purchase states. Count only `captured`, `partially_refunded`, or
`refunded` records when reporting completed sales; `created` and `pending` are checkout attempts.

Administrators can create and copy reusable campaign links at `/admin/attribution`. Campaign source
and campaign pairs are unique, and destinations are limited to paths on the configured Waysorted
origin.
