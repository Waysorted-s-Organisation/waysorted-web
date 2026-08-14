This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Docker environment

The Docker development stack runs Next.js against an isolated MongoDB database
named `waysorted_local`. Production notification producers are disabled by the
Compose configuration.

1. Create the ignored local environment file:

   ```bash
   cp .env.docker.example .env.docker.local
   ```

2. Add localhost Google OAuth credentials and Razorpay **test-mode** credentials
   only when those flows are being tested. The Google callback URL is:

   ```text
   http://localhost:3000/api/auth/callback
   ```

   `DEV_PRICING_COUNTRY` is the explicit local regional-pricing override. In
   production, it is ignored and pricing trusts only Vercel's
   `x-vercel-ip-country` header.

3. Start the application and database:

   ```bash
   docker compose up -d --build web
   ```

   The development container uses Turbopack and mounts the source tree at
   runtime. It does not copy the large `public` directory into the development
   image.

4. Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
docker compose logs -f web
docker compose restart web
docker compose down
```

`docker compose down` preserves the local MongoDB volume. Running
`docker compose down -v` permanently deletes the local database copy.

The optional Figma MCP service is started separately:

```bash
docker compose --profile figma up -d figma-mcp
```

Do not put production database, Razorpay, email, or notification credentials in
`.env.docker.local`. Refreshing the local database from production must be a
controlled owner operation, and the resulting local copy must be treated as
sensitive data.

After deploying the user-scoped usage-reservation idempotency change, run this
once against the intended database before enabling traffic:

```bash
npm run migrate:usage-reservation-index
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Notification Producer

Account activation, preference, feedback, billing, credit, and tool-usage
events are emitted to the newsletter v2 notification ingest service when these
server-side environment variables are configured:

- `NOTIFICATION_INGEST_URL`: Full `/api/v2/notifications/events` ingest URL.
- `NOTIFICATION_INGEST_TOKEN`: Shared ingest token configured on the newsletter service.
- `NOTIFICATION_EVENT_SOURCE`: Event source name allowed by the newsletter service.
- `NOTIFICATION_INGEST_TIMEOUT_MS`: Optional request timeout override.
- `NOTIFICATION_HEAVY_USAGE_CREDIT_THRESHOLD`: Optional credit threshold for
  `tool_usage_heavy` events. Defaults to `100`.
- `NOTIFICATION_LOW_CREDIT_THRESHOLD`: Optional post-reservation balance
  threshold for proactive `credits_low` events. Defaults to `20`.
- `NOTIFICATION_PRODUCER_ENABLED=false`: Optional local kill switch.

Purchase-completion delivery is retried through Razorpay when a configured
Newsletter service is temporarily unreachable or rejects the event. If the
producer is explicitly disabled or has no configuration, payment processing
finishes and records a warning because webhook retries cannot repair missing
deployment configuration.

Razorpay webhook processing uses a two-minute ownership lease. A concurrent
delivery receives a retryable response instead of being acknowledged as a
duplicate, and an expired lease can be claimed safely by a later retry. The
daily maintenance run marks abandoned leases as failed and reconciles captured
one-time purchases whose original webhook or browser callback did not finish.

After deploying the billing schema hardening, run these one-time migrations
against the target database before enabling payment traffic:

```bash
npm run migrate:billing-idempotency-indexes
npm run migrate:redact-razorpay-event-logs
```

The first aligns purchase/refund uniqueness with application idempotency. The
second removes signatures and payer details from historical webhook logs; new
logs are already stored in redacted form and expire after 180 days.

The billing notification producer emits `subscription_checkout_started` when a
subscription checkout is created and the deterministic
`subscription_purchase_completed` event when Razorpay confirms the matching
purchase or subscription. The newsletter service uses these events to schedule
and safely cancel the N3 purchase-retention reminder.

## N4 Product Recall Producer

The daily `/api/cron/n4-product-recall` route identifies previously active
users as they cross seven days without a successful login or committed credited
tool job. It emits deterministic `product_inactive_7d` events. Successful
logins emit `product_activity_resumed`; existing `tool_usage_completed` events
also cancel pending recall work.

Required rollout configuration:

- `CRON_SECRET`: Protects the Vercel Cron route.
- `NOTIFICATION_N4_PRODUCER_ENABLED=false`: Independent producer kill switch.
- `NOTIFICATION_N4_PRODUCER_STARTED_AT`: Required ISO timestamp that prevents
  historical dormant-user backfill.
- `NOTIFICATION_N4_INACTIVITY_DAYS`: Defaults to `7`.
- `NOTIFICATION_N4_SCAN_LOOKBACK_HOURS`: Defaults to `50` for one missed-run
  recovery; deterministic IDs make overlap safe.
- `NOTIFICATION_N4_SCAN_LIMIT`: Defaults to `100` and is capped at `500`.
- `NOTIFICATION_N4_CANARY_TEST_ENABLED=false`: Enables the protected,
  canary-only simulated scan. Keep disabled outside a short test window.
- `NOTIFICATION_N4_PRODUCER_CANARY_EMAILS`: Comma-separated emails permitted
  as simulated scan targets.

To prove the production scanner path without changing activity timestamps or
waiting seven days, temporarily enable the canary test flag and send an
authenticated `POST /api/cron/n4-product-recall` request with
`{"email":"owner@example.com"}`. The endpoint loads that allowlisted user's
real latest successful activity, evaluates the normal scanner just beyond the
configured inactivity threshold, and emits a clearly marked test event. It
never scans another user. Disable the test flag immediately after validation.

This activity definition has partial coverage: it intentionally excludes
non-credit plugin interactions until their telemetry is reliable.
