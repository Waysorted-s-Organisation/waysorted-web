# Checkout UTM attribution

Use standard UTM query parameters on any Waysorted landing page. Each tagged page load is recorded
as an attribution open. The latest tagged visit is kept for 30 days and attached to the next
one-time or subscription purchase created in that browser.

Example link for Madhura:

```text
https://www.waysorted.com/payment?utm_source=madhura&utm_medium=referral&utm_campaign=checkout
```

The browser receives a random UUID in local storage. This lets the operations dashboard estimate
unique visitors and connect an open to a later purchase without storing an email address, IP
address, or user agent in the attribution event. Clearing browser storage or using another browser
creates a new visitor ID.

Attribution is stored on the `Purchase.attribution` object and copied into the Razorpay order or
subscription notes. The anonymous visitor ID is stored only in Waysorted's purchase record. All
attribution fields are informational analytics data and must not be used as authorization or as the
source of pricing or credit decisions.

An administrator can inspect purchases attributed to this source with:

```text
GET /api/admin/billing/purchases?utm_source=madhura
```

The response includes all matching purchase states. Count only `captured`, `partially_refunded`, or
`refunded` records when reporting completed sales; `created` and `pending` are checkout attempts.

Administrators create links and inspect the funnel in the separate operations dashboard's
Attribution page. Campaign source and campaign pairs are unique, and destinations are limited to
paths on the configured Waysorted origin. The report shows link opens, unique browser IDs, checkout
attempts, successful purchases, conversion, and net revenue by currency. Open history begins only
after this tracker is deployed; earlier page loads cannot be backfilled.
