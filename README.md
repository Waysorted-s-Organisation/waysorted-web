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

The billing notification producer emits `subscription_checkout_started` when a
subscription checkout is created and the deterministic
`subscription_purchase_completed` event when Razorpay confirms the matching
purchase or subscription. The newsletter service uses these events to schedule
and safely cancel the N3 purchase-retention reminder.
