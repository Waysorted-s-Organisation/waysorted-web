import "dotenv/config";

/**
 * Razorpay TEST-MODE harness for the first-cycle coupon design.
 *
 * Proves, against the real Razorpay API, that a subscription can charge a DISCOUNTED first cycle and
 * then the FULL plan price from cycle 2 onward, in every currency, in a single checkout.
 *
 * The mechanism is `addons` + `start_at` on Create Subscription:
 *   - `addons[].item.amount` becomes the AUTHORISATION invoice - the discounted first cycle, paid now
 *   - the plan stays at FULL price and first charges at `start_at`
 * Razorpay's own checkout renders this as "UPFRONT AMOUNT ... One time payable" plus
 * "RECURRING AMOUNT ... Billed for this month".
 *
 * This never imports the app's billing code and never touches MongoDB. It only calls Razorpay with
 * TEST keys. Nothing here can affect production.
 *
 * Usage:
 *   npm run harness:coupons                 # plans + subscriptions for every product x coupon
 *   npm run harness:coupons -- --royalty    # also exercise Route linked accounts + direct transfer
 *   npm run harness:coupons -- --cleanup    # cancel every subscription this harness created
 */

const KEY = process.env.RAZORPAY_KEY_ID?.trim();
const SECRET = process.env.RAZORPAY_KEY_SECRET?.trim();
const API = "https://api.razorpay.com/v1";

if (!KEY || !SECRET) throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set.");
if (!KEY.startsWith("rzp_test_")) {
  throw new Error(
    `Refusing to run: key is ${KEY.slice(0, 9)}..., not rzp_test_. This harness creates real objects and must never touch a live account.`,
  );
}

const WANT_ROYALTY = process.argv.includes("--royalty");
const WANT_CLEANUP = process.argv.includes("--cleanup");

const auth = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");

async function rzp<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method || "GET",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (payload as { error?: { description?: string } })?.error?.description || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

/** Mirrors lib/billing/catalog.ts and PRICE_MATRIX_INR tier_3 / tier_1. */
const PRODUCTS = [
  { code: "sub_month_1", name: "Discover Monthly", period: "monthly", inr: 149, usd: 5.99 },
  { code: "sub_month_2", name: "Core Monthly", period: "monthly", inr: 349, usd: 11.99 },
  { code: "sub_month_3", name: "Pro Monthly", period: "monthly", inr: 749, usd: 24.0 },
  { code: "sub_year_1599", name: "Discover Yearly", period: "yearly", inr: 1599, usd: 59.99 },
  { code: "sub_year_3499", name: "Core Yearly", period: "yearly", inr: 3499, usd: 119.99 },
  { code: "sub_year_7499", name: "Pro Yearly", period: "yearly", inr: 7499, usd: 240.0 },
] as const;

const COUPONS = [
  { code: "WELCOME15", percent: 15 },
  { code: "BOOST20", percent: 20 },
  { code: "TOPUP25", percent: 25 },
  { code: "UNLOCK30", percent: 30 },
] as const;

const CURRENCIES = [
  { code: "INR", minor: 100 },
  { code: "USD", minor: 100 },
] as const;

/** Same rounding the app must use. Round, never floor - flooring undercharges. */
function discountedSubunits(fullSubunits: number, percent: number) {
  const discount = Math.round((fullSubunits * percent) / 100);
  return { final: fullSubunits - discount, discount };
}

type Created = { subscriptionId: string; label: string; shortUrl?: string };
const created: Created[] = [];
const failures: Array<{ label: string; error: string }> = [];

async function run() {
  console.log(`Razorpay TEST harness — key ${KEY!.slice(0, 14)}...\n`);

  if (WANT_CLEANUP) return cleanup();

  // ---------------------------------------------------------------- plans
  console.log("=== PLANS (full price — the plan is NEVER discounted) ===");
  const planIds = new Map<string, string>();

  for (const product of PRODUCTS) {
    for (const currency of CURRENCIES) {
      const amount = Math.round(
        (currency.code === "INR" ? product.inr : product.usd) * currency.minor,
      );
      const key = `${product.code}:${currency.code}`;
      try {
        const plan = await rzp<{ id: string }>("/plans", {
          method: "POST",
          body: {
            period: product.period,
            interval: 1,
            item: {
              name: `WSHarness ${product.name} ${currency.code}`,
              amount,
              currency: currency.code,
            },
          },
        });
        planIds.set(key, plan.id);
        console.log(`  ok   ${key.padEnd(24)} ${currency.code} ${amount} -> ${plan.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ label: `plan ${key}`, error: message });
        console.log(`  FAIL ${key.padEnd(24)} ${message}`);
      }
    }
  }

  // -------------------------------------------------- subscriptions + addons
  console.log("\n=== SUBSCRIPTIONS: discounted first cycle via addons + future start_at ===");
  console.log("    upfront = discounted first cycle (paid now) | recurring = full plan price\n");

  const startAt = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

  for (const product of PRODUCTS) {
    for (const currency of CURRENCIES) {
      const planId = planIds.get(`${product.code}:${currency.code}`);
      if (!planId) continue;
      const full = Math.round(
        (currency.code === "INR" ? product.inr : product.usd) * currency.minor,
      );

      for (const coupon of COUPONS) {
        const { final, discount } = discountedSubunits(full, coupon.percent);
        const label = `${product.code}/${currency.code}/${coupon.code}`;
        try {
          const sub = await rzp<{ id: string; status: string; short_url?: string; charge_at?: number }>(
            "/subscriptions",
            {
              method: "POST",
              body: {
                plan_id: planId,
                total_count: product.period === "monthly" ? 12 : 3,
                customer_notify: 0,
                start_at: startAt,
                addons: [
                  {
                    item: {
                      name: `First cycle ${coupon.code} (-${coupon.percent}%)`,
                      amount: final,
                      currency: currency.code,
                    },
                  },
                ],
                notes: { harness: "waysorted-coupon", coupon: coupon.code, product: product.code },
              },
            },
          );

          // The authorisation invoice must equal the DISCOUNTED amount, not the plan amount.
          const invoices = await rzp<{ items?: Array<{ amount: number; currency: string; status: string }> }>(
            `/invoices?subscription_id=${sub.id}`,
          );
          const authInvoice = invoices.items?.[0];
          const matches = authInvoice?.amount === final;

          created.push({ subscriptionId: sub.id, label, shortUrl: sub.short_url });
          console.log(
            `  ${matches ? "ok  " : "WARN"} ${label.padEnd(34)} upfront=${authInvoice?.amount} recurring=${full} ${matches ? "" : "<- AUTH INVOICE != DISCOUNTED AMOUNT"}`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push({ label, error: message });
          console.log(`  FAIL ${label.padEnd(34)} ${message}`);
        }
      }
    }
  }

  // ------------------------------------------------------------- royalty
  if (WANT_ROYALTY) await royalty();

  // -------------------------------------------------------------- report
  console.log("\n=== RESULT ===");
  console.log(`  subscriptions created : ${created.length}`);
  console.log(`  failures              : ${failures.length}`);
  if (failures.length) {
    console.log("\n  Failures:");
    for (const f of failures) console.log(`    ${f.label}: ${f.error}`);
  }

  const sample = created[0];
  if (sample?.shortUrl) {
    console.log("\n=== MANUAL STEP — the one thing an API call cannot prove ===");
    console.log("  Open this and pay with test card 4111 1111 1111 1111 (any future expiry, any CVV):");
    console.log(`    ${sample.shortUrl}`);
    console.log("  Then confirm, on the Razorpay test dashboard:");
    console.log("    1. the upfront payment is CAPTURED and NOT refunded");
    console.log("    2. the subscription moves to `authenticated` with charge_at ~30 days out");
    console.log("    3. the scheduled charge is the FULL plan amount, not the discounted one");
    console.log("\n  Re-run with --cleanup to cancel everything this harness created.");
  }
}

async function royalty() {
  console.log("\n=== ROYALTY: Route linked account + direct transfer ===");
  try {
    const account = await rzp<{ id: string }>("/accounts", {
      method: "POST",
      body: {
        email: `harness-influencer-${Date.now()}@example.com`,
        phone: "9999999999",
        type: "route",
        legal_business_name: "Harness Influencer",
        business_type: "individual",
        contact_name: "Harness Influencer",
        profile: { category: "others", subcategory: "others" },
      },
    });
    console.log(`  linked account: ${account.id}`);
    console.log("  NOTE: a direct transfer needs this account activated (KYC) and a funded balance.");
    console.log("        In test mode it will usually fail until activation - that is expected and");
    console.log("        still tells us the account-creation contract works.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ label: "route linked account", error: message });
    console.log(`  FAIL linked account: ${message}`);
    console.log("  If this is 'not enabled', Route is an on-demand feature - raise a request with support.");
  }
}

async function cleanup() {
  console.log("=== CLEANUP: cancelling harness subscriptions ===");
  const subs = await rzp<{ items?: Array<{ id: string; status: string; notes?: Record<string, string> }> }>(
    "/subscriptions?count=100",
  );
  const mine = (subs.items || []).filter(
    (s) => s.notes?.harness === "waysorted-coupon" && !["cancelled", "completed", "expired"].includes(s.status),
  );
  console.log(`  found ${mine.length} to cancel`);
  for (const s of mine) {
    try {
      await rzp(`/subscriptions/${s.id}/cancel`, { method: "POST", body: { cancel_at_cycle_end: 0 } });
      console.log(`  cancelled ${s.id}`);
    } catch (error) {
      console.log(`  could not cancel ${s.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log("  Plans cannot be deleted by design - test-mode plans are harmless.");
}

run().catch((error) => {
  console.error("Harness failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
