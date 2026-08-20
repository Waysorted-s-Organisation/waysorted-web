"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/billing/money";
import { yearlySavingPercent } from "@/lib/billing/plan-savings";
import { isLiveSubscriptionStatus } from "@/lib/billing/subscription-status";
import { getMonthlyCounterpartCode, getPlanUi } from "@/app/pricing/pricing-presentation";
import Image from "next/image";
import OrderComplete, { type OrderCompleteProps } from "@/components/OrderComplete";
import { unlockPrinterAudio } from "@/components/OrderComplete/printer-sound";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  subscription_id?: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    metadata?: { payment_id?: string };
  };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
};

type CatalogProduct = {
  code: string;
  name: string;
  kind: "starter" | "topup" | "subscription";
  eligibility: string;
  priceInr: number;
  amountPaise: number;
  creditsGranted: number;
  bonusCredits: number;
  billingCycle: "one_time" | "monthly" | "yearly";
  currency: string;
  basePriceInr?: number;
  displayAmount?: number;
  pricingCountry?: string;
  pricingCountryName?: string;
  pricingTier?: "tier_1" | "tier_2" | "tier_3";
  pricingRiskFlags?: string[];
};

type BillingSnapshot = {
  id: string;
  name?: string;
  email: string;
  picture?: string;
  creditsRemaining: number;
  billing: {
    wallet: {
      availableCredits: number;
      heldCredits: number;
      spendableCredits: number;
    };
    subscription: {
      planCode: string | null;
      status: string;
      renewsAt: string | null;
      willCancelAt: string | null;
      cancelAtCycleEnd: boolean;
    };
    capabilities: {
      customizablePresets: boolean;
      canPurchaseTopups: boolean;
      canPurchaseStarterPack: boolean;
    };
    catalog: CatalogProduct[];
    pricingVersion: string;
    pricing: {
      country: string;
      countryName: string;
      tier: "tier_1" | "tier_2" | "tier_3";
      currency: string;
      riskFlags: string[];
      locked: boolean;
      source: string;
    };
  };
};

type CurrentSubscription = {
  subscription: {
    id: string;
    providerSubscriptionId: string;
    planCode: string;
    status: string;
    currentPeriodEnd?: string;
    nextChargeAt?: string;
    cancelAtCycleEnd: boolean;
  } | null;
};

let razorpayScriptPromise: Promise<void> | null = null;

function getRazorpayConstructor() {
  return (window as Window & {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }).Razorpay;
}

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only run in the browser."));
  }

  if (getRazorpayConstructor()) return Promise.resolve();

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const fail = (error: Error) => {
        razorpayScriptPromise = null;
        reject(error);
      };
      const timer = window.setTimeout(() => {
        fail(new Error("Razorpay checkout could not load. Disable blockers or try another network."));
      }, 15_000);
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existing) {
        existing.addEventListener("load", () => { window.clearTimeout(timer); resolve(); }, { once: true });
        existing.addEventListener("error", () => { window.clearTimeout(timer); fail(new Error("Failed to load Razorpay.")); }, {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => { window.clearTimeout(timer); resolve(); };
      script.onerror = () => { window.clearTimeout(timer); fail(new Error("Failed to load Razorpay.")); };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function formatCurrency(amountSubunits: number, currency = "INR") {
  return formatMoney(amountSubunits, currency);
}

function formatDate(value?: string | null) {
  if (!value) return "NA";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SUBSCRIPTION_BENEFITS = [
  "Includes all Premium Waysorted features",
  "Regular updates with ongoing support",
  "Lowest cost for credit top-ups",
  "Credits never expire, no monthly resets.",
];

const TOPUP_BENEFITS = [
  "Credits land in your wallet as soon as the payment settles",
  "Usable across every Waysorted tool",
  "No subscription required",
  "Credits never expire, no monthly resets.",
];

/**
 * Strips the provider prefix so the receipt reads `Order #Nq8Kf...` rather than
 * `Order #order_Nq8Kf...`. The reference itself is unchanged, because support
 * looks payments up by it.
 */
function orderNumberFrom(reference: string) {
  return reference.replace(/^(order_|sub_)/, "");
}

function couponMessage(reason?: string): string {
  switch (reason) {
    case "coupon_already_used":
      return "You have already used this code.";
    case "coupon_exhausted":
      return "This code has reached its limit.";
    case "coupon_expired":
      return "This code has expired.";
    case "coupon_not_started":
      return "This code is not active yet.";
    case "coupon_not_applicable":
      return "This code does not apply to this plan.";
    default:
      return "That code cannot be applied to this plan.";
  }
}

export default function BillingClient({
  autostart,
  initialProductCode,
  quotedAmountSubunits = null,
  quotedCurrency = null,
  quotedPricingVersion = null,
}: {
  autostart: boolean;
  initialProductCode: string | null;
  /** Price the customer was shown on /pricing, if they arrived from there. */
  quotedAmountSubunits?: number | null;
  quotedCurrency?: string | null;
  quotedPricingVersion?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription["subscription"] | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialProductCode);
  const [status, setStatus] = useState("Loading billing...");
  const [busyCode, setBusyCode] = useState<string | null>(null);
  // Prefilled from ?coupon=, so the plugin's "Claim Now" carries the code the
  // customer was actually shown rather than asking them to retype it. The
  // server still validates it; this only saves the typing.
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponQuote, setCouponQuote] = useState<{
    code: string;
    percent: number;
    discountSubunits: number;
    upfrontSubunits: number;
    recurringSubunits: number;
    currency: string;
  } | null>(null);
  // Set only once a payment has been verified by the server. It is the trigger
  // for the receipt screen, so it must never be set on a pending or unverified
  // payment - a receipt is a statement that money moved.
  const [completedOrder, setCompletedOrder] = useState<OrderCompleteProps | null>(null);
  // The discount this customer could actually use, resolved server-side.
  const [bestOffer, setBestOffer] = useState<{
    code: string;
    percent: number;
    upfrontSubunits: number;
    recurringSubunits: number;
    currency: string;
  } | null>(null);
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const planMenuRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const autostartedRef = useRef(false);
  const checkoutAttemptKeysRef = useRef(new Map<string, string>());

  const redirectPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const bridgeExpired = searchParams.get("bridge") === "expired";
  const urlCoupon = searchParams.get("coupon")?.trim().toUpperCase() || "";
  useEffect(() => {
    if (urlCoupon) setCouponInput(urlCoupon);
  }, [urlCoupon]);


  const selectedProduct = useMemo(
    () => snapshot?.billing.catalog.find((product) => product.code === selectedCode) || null,
    [selectedCode, snapshot?.billing.catalog],
  );

  /**
   * True when the price on this page differs from the one the customer was shown on /pricing.
   *
   * /pricing may serve the unauthenticated catalog (detected country, no pricing lock) while this
   * page prices from the authenticated snapshot, so the amount can legitimately change across the
   * login boundary. When it does, the customer must see the new number and confirm it - never have
   * a payment modal opened for them at a price they were never shown.
   */
  const quoteDrift = useMemo(() => {
    if (!selectedProduct || quotedAmountSubunits === null || !quotedCurrency) return null;
    const sameAmount = selectedProduct.amountPaise === quotedAmountSubunits;
    const sameCurrency = selectedProduct.currency.toUpperCase() === quotedCurrency.toUpperCase();
    if (sameAmount && sameCurrency) return null;
    return { amountPaise: quotedAmountSubunits, currency: quotedCurrency.toUpperCase() };
  }, [quotedAmountSubunits, quotedCurrency, selectedProduct]);

  const shouldShowSubscriptionPanel =
    Boolean(currentSubscription) || Boolean(snapshot && snapshot.billing.subscription.status !== "inactive");

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch(`/api/billing/snapshot?ts=${Date.now()}`, { cache: "no-store" });
    const payload = (await response.json()) as BillingSnapshot | { error?: string };
    if (!response.ok || !("billing" in payload)) {
      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
      throw new Error(("error" in payload && payload.error) || "Unable to load billing snapshot.");
    }
    setSnapshot(payload);
    if (!selectedCode && payload.billing.catalog.length > 0) {
      // The catalogue is ordered starter, top-up, subscription, so catalog[0]
      // is always a top-up. A customer arriving from a discount link with no
      // product named therefore landed on a product no code can apply to, was
      // told "this code does not apply to this plan", and had no way forward.
      // Codes are subscription-only, so a code in the URL picks a subscription.
      const wantsCoupon = Boolean(urlCoupon);
      const preferred = wantsCoupon
        ? payload.billing.catalog.find((product) => product.kind === "subscription")
        : null;
      setSelectedCode((preferred || payload.billing.catalog[0]).code);
    }
    return payload;
    // urlCoupon changes only when the query string does, which already moves
    // redirectPath above, so this adds no extra churn.
  }, [redirectPath, router, selectedCode, urlCoupon]);

  const refreshCurrentSubscription = useCallback(async () => {
    const response = await fetch(`/api/billing/subscriptions/current?ts=${Date.now()}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as CurrentSubscription | { error?: string };
    if (response.ok && "subscription" in payload) {
      setCurrentSubscription(payload.subscription);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadRazorpayScript(), refreshSnapshot()])
      .then(() => {
        setScriptReady(true);
        setStatus("Billing ready.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Unable to load billing.");
      });
  }, [refreshSnapshot]);

  useEffect(() => {
    if (!snapshot || !initialProductCode) return;
    const available = snapshot.billing.catalog.some((product) => product.code === initialProductCode);
    if (!available) {
      setSelectedCode(snapshot.billing.catalog[0]?.code || null);
      setStatus("That plan is not available on your account. Pick an available option below.");
    }
  }, [initialProductCode, snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    // One shared definition rather than a fourth hand-written copy. This list
    // had drifted: it omitted "scheduled", where every discounted subscription
    // rests for its whole first cycle, so refreshCurrentSubscription never ran
    // and the Cancel button never rendered for the customers who had just paid
    // with a code. It also omitted "halted".
    if (!isLiveSubscriptionStatus(snapshot.billing.subscription.status)) return;

    refreshCurrentSubscription().catch(() => {
      // Snapshot already contains the current entitlement state; this panel is supplemental.
    });
  }, [refreshCurrentSubscription, snapshot]);

  const waitForWalletUpdate = useCallback(async (baselineCredits: number | null) => {
    let latestSnapshot: BillingSnapshot | null = null;
    for (let index = 0; index < 12; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 + index * 500, 5000)));
      try {
        latestSnapshot = await refreshSnapshot();
        if (
          baselineCredits === null ||
          latestSnapshot.billing.wallet.availableCredits !== baselineCredits
        ) {
          return { latestSnapshot, settled: true };
        }
      } catch {
        // Payment has already been verified. A transient snapshot failure must
        // not be presented as a failed payment; continue the recovery poll.
      }
    }
    return {
      latestSnapshot,
      settled: Boolean(latestSnapshot && (
        baselineCredits === null ||
        latestSnapshot.billing.wallet.availableCredits !== baselineCredits
      )),
    };
  }, [refreshSnapshot]);

  const handleOrderCheckout = useCallback(async (product: CatalogProduct) => {
    const Razorpay = getRazorpayConstructor();
    if (!Razorpay) {
      setStatus("Razorpay checkout is unavailable. Disable blockers or try another network.");
      return;
    }
    setBusyCode(product.code);
    setStatus(`Creating order for ${product.name}...`);
    const baselineCredits = snapshot?.billing.wallet.availableCredits ?? null;
    const attemptKey = checkoutAttemptKeysRef.current.get(product.code) || crypto.randomUUID();
    checkoutAttemptKeysRef.current.set(product.code, attemptKey);

    try {
      const response = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: product.code,
          idempotencyKey: `billing-page:${product.code}:${attemptKey}`,
          // The exact amount rendered on the button the customer just pressed. The server rejects
          // the order with 409 pricing_quote_changed if its own price no longer matches.
          quotedAmountSubunits: product.amountPaise,
          quotedCurrency: product.currency,
          pricingVersion: snapshot?.billing.pricingVersion,
        }),
      });

      const payload = (await response.json()) as
        | {
            purchaseId: string;
            orderId: string;
            amount: number;
            currency: string;
            key: string;
          }
        | { error?: string };

      if (!response.ok || !("orderId" in payload)) {
        // A price change is not a failure - refresh so the page shows the real amount, and let the
        // customer decide. Throwing a bare string here used to leave the page stuck displaying the
        // old price with no way forward.
        if ("code" in payload && payload.code === "pricing_quote_changed") {
          checkoutAttemptKeysRef.current.delete(product.code);
          await refreshSnapshot().catch(() => null);
          setBusyCode(null);
          setStatus(
            "The price for this plan changed before checkout. The amount shown has been updated - review it and continue if you agree. Nothing has been charged.",
          );
          return;
        }
        throw new Error(("error" in payload && payload.error) || "Unable to create order.");
      }

      const checkout = new Razorpay({
        key: payload.key,
        amount: payload.amount,
        currency: payload.currency,
        order_id: payload.orderId,
        name: "Waysorted",
        description: product.name,
        prefill: {
          name: snapshot?.name,
          email: snapshot?.email,
          contact: "",
        },
        notes: {
          productCode: product.code,
          purchaseId: payload.purchaseId,
        },
        theme: { color: "#265BD1" },
        modal: {
          ondismiss: () => {
            setBusyCode(null);
            setStatus("Checkout closed.");
          },
        },
        handler: async (checkoutResponse) => {
          try {
            setStatus("Payment received. Verifying signature and waiting for webhook sync...");
            const verifyResponse = await fetch("/api/billing/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                purchaseId: payload.purchaseId,
                orderId: payload.orderId,
                ...checkoutResponse,
              }),
            });

            const verifyPayload = (await verifyResponse.json().catch(() => ({}))) as {
              verified?: boolean;
              error?: string;
            };

            if (!verifyResponse.ok || verifyPayload.verified !== true) {
              throw new Error(verifyPayload.error || "Unable to verify payment.");
            }

            checkoutAttemptKeysRef.current.delete(product.code);
            setPaidOrderId(payload.orderId);
            // Shown as soon as the server has verified the payment, not after
            // the wallet poll below - the poll can take 40s, and by then the
            // charge is already a fact the customer is entitled to see.
            setCompletedOrder({
              orderNumber: orderNumberFrom(payload.orderId),
              itemName: product.name,
              amount: formatCurrency(payload.amount, payload.currency),
            });

            const { settled } = await waitForWalletUpdate(baselineCredits);
            setStatus(
              settled
                ? `Payment confirmed. Credits updated. Order: ${payload.orderId}.`
                : `Payment received (ref: ${checkoutResponse.razorpay_payment_id}, order: ${payload.orderId}). Credits are pending; keep this reference for support.`,
            );
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Payment verification failed.");
          } finally {
            setBusyCode(null);
          }
        },
      });

      checkout.on("payment.failed", (failure) => {
        const description = failure.error?.description || "The payment was declined.";
        const code = failure.error?.code ? ` (${failure.error.code})` : "";
        setStatus(`Payment failed: ${description}${code} You can retry this checkout.`);
        setBusyCode(null);
      });

      checkout.open();
    } catch (error) {
      checkoutAttemptKeysRef.current.delete(product.code);
      setStatus(error instanceof Error ? error.message : "Checkout failed.");
      setBusyCode(null);
    }
  }, [
    snapshot?.billing.wallet.availableCredits,
    snapshot?.billing.pricingVersion,
    snapshot?.email,
    snapshot?.name,
    waitForWalletUpdate,
  ]);

  /**
   * Asks the server what a code is worth.
   *
   * The client cannot compute this. The checkout quote guard compares the
   * client's figure against the server's own upfront, so any locally-derived
   * number — a hardcoded percent table, a stale prior response — is rejected on
   * every attempt. Debounced, and the in-flight code is tracked so a slow
   * response for an earlier code cannot overwrite a newer one.
   */
  const couponRequestRef = useRef(0);
  const checkCoupon = useCallback(
    async (product: CatalogProduct, code: string) => {
      const normalized = code.trim().toUpperCase();
      const requestId = ++couponRequestRef.current;
      if (!normalized) {
        setCouponQuote(null);
        setCouponError(null);
        return null;
      }
      setCouponChecking(true);
      try {
        const response = await fetch("/api/billing/coupons/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productCode: product.code, couponCode: normalized }),
        });
        const payload = (await response.json()) as {
          valid?: boolean;
          reason?: string;
          coupon?: {
            code: string;
            percent: number;
            discountSubunits: number;
            upfrontSubunits: number;
            recurringSubunits: number;
            currency: string;
          };
        };
        if (requestId !== couponRequestRef.current) return null;

        if (!response.ok || !payload.valid || !payload.coupon) {
          setCouponQuote(null);
          setCouponError(couponMessage(payload.reason));
          return null;
        }
        setCouponQuote(payload.coupon);
        setCouponError(null);
        return payload.coupon;
      } catch {
        if (requestId !== couponRequestRef.current) return null;
        setCouponQuote(null);
        setCouponError("Could not check that code. You can still continue at the full price.");
        return null;
      } finally {
        if (requestId === couponRequestRef.current) setCouponChecking(false);
      }
    },
    [],
  );

  // A code arriving by link is applied automatically, so both entry points end
  // in the SAME state: priced, confirmed on screen, and locked. Prefilling the
  // box without applying would leave someone to notice an Apply button they
  // never asked for, and pay full price if they missed it.
  const autoAppliedRef = useRef("");
  useEffect(() => {
    if (!urlCoupon || !selectedProduct) return;
    if (autoAppliedRef.current === `${urlCoupon}:${selectedProduct.code}`) return;
    autoAppliedRef.current = `${urlCoupon}:${selectedProduct.code}`;
    // The preview endpoint answers 400 for a non-subscription product, and a 400
    // carries no `reason`, so couponMessage fell through to the generic "that
    // code cannot be applied to this plan" - which was rendered only inside the
    // subscription-only banner, i.e. nowhere. The customer saw no trace of the
    // code at all. Say the true thing instead of calling an endpoint we know
    // will refuse.
    if (selectedProduct.kind !== "subscription") {
      setCouponQuote(null);
      setCouponError(
        `${urlCoupon} applies to subscription plans, not credit top-ups. Choose a plan to use it.`,
      );
      return;
    }
    void checkCoupon(selectedProduct, urlCoupon);
  }, [urlCoupon, selectedProduct, checkCoupon]);

  const handleSubscriptionCheckout = useCallback(async (
    product: CatalogProduct,
    couponCode?: string,
    /**
     * The server's own quote for this code, passed in rather than read from
     * state. Reading it from state was the defect: setCouponQuote is only
     * written FROM a successful create response, so on the first submit it was
     * always null, the client quoted the list price, and the server 409'd its
     * own upfront. Every coupon checkout failed, always.
     */
    appliedQuote?: { upfrontSubunits: number } | null,
  ) => {
    setBusyCode(product.code);
    setStatus(`Creating subscription for ${product.name}...`);
    const attemptKey = checkoutAttemptKeysRef.current.get(product.code) || crypto.randomUUID();
    checkoutAttemptKeysRef.current.set(product.code, attemptKey);

    try {
      const response = await fetch("/api/billing/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: product.code,
          idempotencyKey: `billing-page:subscription:${product.code}:${attemptKey}`,
          // See handleOrderCheckout: pins the charge to the amount the customer was shown.
          // With a coupon the customer is charged the discounted upfront, so
          // that is what must be quoted. Quoting the list price would 409
          // against the server's own upfront on every coupon checkout.
          quotedAmountSubunits: appliedQuote?.upfrontSubunits ?? product.amountPaise,
          quotedCurrency: product.currency,
          pricingVersion: snapshot?.billing.pricingVersion,
          ...(couponCode ? { couponCode } : {}),
        }),
      });

      const payload = (await response.json()) as
        | {
            purchaseId: string;
            subscriptionId: string;
            key: string;
            coupon?: {
              code: string;
              percent: number;
              discountSubunits: number;
              upfrontSubunits: number;
              recurringSubunits: number;
              currency: string;
            };
          }
        | { error?: string; code?: string; reason?: string };

      if (!response.ok || !("subscriptionId" in payload)) {
        // See handleOrderCheckout: a price change is a decision point, not a failure.
        // A rejected code is its own outcome, not a checkout failure: the
        // customer can continue at full price, and telling them "checkout
        // failed" would hide that.
        if ("code" in payload && payload.code === "coupon_invalid") {
          checkoutAttemptKeysRef.current.delete(product.code);
          setBusyCode(null);
          setCouponError(
            payload.reason === "coupon_already_used"
              ? "You have already used this code."
              : payload.reason === "coupon_exhausted"
                ? "This code has reached its limit."
                : payload.reason === "coupon_expired"
                  ? "This code has expired."
                  : "That code cannot be applied to this plan.",
          );
          setStatus("Nothing has been charged.");
          return;
        }
        if ("code" in payload && payload.code === "pricing_quote_changed") {
          checkoutAttemptKeysRef.current.delete(product.code);
          await refreshSnapshot().catch(() => null);
          setBusyCode(null);
          setStatus(
            "The price for this plan changed before checkout. The amount shown has been updated - review it and continue if you agree. Nothing has been charged.",
          );
          return;
        }
        throw new Error(("error" in payload && payload.error) || "Unable to create subscription.");
      }

      if ("coupon" in payload && payload.coupon) {
        setCouponQuote(payload.coupon);
        setCouponError(null);
      }

      const Razorpay = getRazorpayConstructor();
      if (!Razorpay) {
        throw new Error("Razorpay checkout did not initialize.");
      }

      const checkout = new Razorpay({
        key: payload.key,
        subscription_id: payload.subscriptionId,
        name: "Waysorted",
        description: product.name,
        prefill: {
          name: snapshot?.name,
          email: snapshot?.email,
          contact: "",
        },
        notes: {
          productCode: product.code,
        },
        theme: { color: "#265BD1" },
        modal: {
          ondismiss: () => {
            // Clear the cached attempt key. It is folded into the idempotency
            // key together with the coupon, so leaving it would let an
            // abandoned full-price attempt bind the customer's next attempt
            // with a code applied.
            checkoutAttemptKeysRef.current.delete(product.code);
            setBusyCode(null);
            setStatus("Subscription checkout closed.");
          },
        },
        handler: async (checkoutResponse) => {
          try {
            setStatus("Subscription payment received. Verifying with Razorpay...");
            const verifyResponse = await fetch("/api/billing/subscriptions/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                purchaseId: payload.purchaseId,
                ...checkoutResponse,
              }),
            });
            const verification = (await verifyResponse.json().catch(() => ({}))) as {
              verified?: boolean;
              pending?: boolean;
              code?: string;
              paymentId?: string;
              error?: string;
            };

            // A payment still in flight is not a failure. With UPI AutoPay the
            // debit is processed when the customer approves the mandate in
            // their UPI app, which Razorpay says can land a few minutes after
            // the subscription is created - so telling them it failed would be
            // wrong, and they might pay twice. The cycle reconciler settles the
            // purchase and grants credits when the capture arrives.
            if (verification.pending || verification.code === "payment_processing") {
              checkoutAttemptKeysRef.current.delete(product.code);
              setBusyCode(null);
              setStatus(
                verification.error ||
                  "Your payment is being confirmed. This can take a few minutes with UPI - your subscription will activate automatically.",
              );
              await refreshSnapshot().catch(() => null);
              return;
            }

            if (!verifyResponse.ok || verification.verified !== true) {
              throw new Error(verification.error || "Unable to verify subscription payment.");
            }

            checkoutAttemptKeysRef.current.delete(product.code);

            // Built from the server's own coupon figures in the create response,
            // never from the client's cached quote, so the receipt states the
            // amount that was actually charged.
            const cycle = product.billingCycle === "yearly" ? "year" : "month";
            const applied = payload.coupon;
            setCompletedOrder({
              orderNumber: orderNumberFrom(payload.subscriptionId),
              // The name the customer chose it by. product.name is the
              // catalogue's internal label ("Monthly 2"), so the receipt named
              // the plan something they had never seen on /pricing or checkout.
              itemName: getPlanUi(product.code)?.planName
                ? `Waysorted ${getPlanUi(product.code)?.planName}`
                : product.name,
              amount: formatCurrency(product.amountPaise, product.currency),
              total: applied
                ? formatCurrency(applied.upfrontSubunits, applied.currency)
                : formatCurrency(product.amountPaise, product.currency),
              discountLabel: applied ? `${applied.code} (${applied.percent}% off)` : null,
              discountAmount: applied
                ? `-${formatCurrency(applied.discountSubunits, applied.currency)}`
                : null,
              footnote: applied
                ? `First ${cycle} at the discounted rate, then ${formatCurrency(
                    applied.recurringSubunits,
                    applied.currency,
                  )} per ${cycle}.`
                : `Renews at ${formatCurrency(product.amountPaise, product.currency)} per ${cycle}.`,
            });

            setStatus("Subscription payment verified. Waiting for entitlement sync...");
            let settled = false;

            for (let index = 0; index < 6; index += 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              await refreshCurrentSubscription();
              const latestSnapshot = await refreshSnapshot();
              if (latestSnapshot.billing.subscription.status !== "payment_pending") {
                settled = true;
                break;
              }
            }

            setStatus(
              settled
                ? "Subscription confirmed. Entitlements updated."
                : `Payment received (ref: ${verification.paymentId || checkoutResponse.razorpay_payment_id}). Entitlement sync is pending; keep this reference for support.`,
            );
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Unable to refresh subscription.");
          } finally {
            setBusyCode(null);
          }
        },
      });

      checkout.on("payment.failed", (failure) => {
        const description = failure.error?.description || "The payment was declined.";
        const code = failure.error?.code ? ` (${failure.error.code})` : "";
        setStatus(`Subscription payment failed: ${description}${code} You can retry this checkout.`);
        setBusyCode(null);
      });

      checkout.open();
    } catch (error) {
      checkoutAttemptKeysRef.current.delete(product.code);
      setStatus(error instanceof Error ? error.message : "Subscription checkout failed.");
      setBusyCode(null);
    }
  }, [refreshCurrentSubscription, refreshSnapshot, snapshot?.billing.pricingVersion, snapshot?.email, snapshot?.name]);

  useEffect(() => {
    if (!autostart || autostartedRef.current || !scriptReady || !selectedProduct || busyCode) return;

    /**
     * Only ever auto-open the product the link actually named.
     *
     * When `?product=` names something the account cannot buy, the page
     * substitutes the first catalogue entry and sets a message - but `autostart`
     * stayed armed, so Razorpay opened for a DIFFERENT product than the link
     * asked for. The drift guard could not catch it: drift compares against
     * `?qa`/`?qc`, which only the /pricing hand-off carries, so on any other
     * link `quoteDrift` is null and the guard is inert.
     *
     * Consuming autostart here rather than in the substitution effect makes it
     * independent of effect ordering. The message set at substitution time stays
     * on screen to explain why nothing opened.
     */
    if (!initialProductCode || selectedProduct.code !== initialProductCode) {
      autostartedRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("autostart")) {
        params.delete("autostart");
        router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
      }
      return;
    }

    // A discount code cannot apply to a top-up, so opening the payment sheet
    // here would charge the full price seconds after a modal promised a
    // discount. Let them pick a plan instead.
    if (urlCoupon && selectedProduct.kind !== "subscription") {
      autostartedRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("autostart")) {
        params.delete("autostart");
        router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
      }
      setStatus(`${urlCoupon} applies to subscription plans. Nothing has been charged.`);
      return;
    }

    // Never auto-open Razorpay at a price the customer has not seen. On drift, stop here and let
    // the confirmation banner below render both amounts so they can decide.
    if (quoteDrift) {
      autostartedRef.current = true;
      const driftParams = new URLSearchParams(searchParams.toString());
      if (driftParams.has("autostart")) {
        driftParams.delete("autostart");
        router.replace(driftParams.size ? `${pathname}?${driftParams.toString()}` : pathname, {
          scroll: false,
        });
      }
      return;
    }

    autostartedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("autostart")) {
      params.delete("autostart");
      router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    }
    void (async () => {
      if (selectedProduct.kind !== "subscription") {
        await handleOrderCheckout(selectedProduct);
        return;
      }
      if (!urlCoupon) {
        await handleSubscriptionCheckout(selectedProduct, undefined, null);
        return;
      }
      // A deep link from the plugin modal carries the code but no price. Resolve
      // it before opening checkout, or the quote guard rejects it and the
      // customer sees "the price changed" for a link we sent them.
      const quote = await checkCoupon(selectedProduct, urlCoupon);
      if (!quote) {
        return;
      }
      await handleSubscriptionCheckout(selectedProduct, urlCoupon, quote);
    })();
  }, [
    autostart,
    busyCode,
    handleOrderCheckout,
    handleSubscriptionCheckout,
    initialProductCode,
    pathname,
    quoteDrift,
    router,
    checkCoupon,
    scriptReady,
    snapshot,
    urlCoupon,
    searchParams,
    selectedProduct,
  ]);

  /**
   * The plan rows.
   *
   * Built from the catalogue rather than hardcoded, so a plan the account is not
   * entitled to never appears - the previous card hid this behind a "Change
   * plan" toggle, and a chooser nobody opens is a chooser nobody uses.
   */
  const planOptions = useMemo(() => {
    const catalog = snapshot?.billing.catalog || [];
    const wantSubscription = selectedProduct ? selectedProduct.kind === "subscription" : true;
    const members = catalog.filter((product) => (product.kind === "subscription") === wantSubscription);
    const byCode = new Map(catalog.map((product) => [product.code, product]));

    return members.map((product) => {
      // The name the customer already read on /pricing - Discover, Core, Pro.
      // The catalogue's own `name` is an internal label ("Monthly 2"), and
      // showing it here meant the plan someone picked on the pricing page was
      // called something else the moment they reached checkout.
      const planName = getPlanUi(product.code)?.planName || product.name;

      // Paired by TIER, not by whichever monthly plan came first in the
      // catalogue. Comparing every yearly against Discover's monthly meant only
      // the Discover row ever showed a saving, and the other two silently
      // showed none despite being discounted by the same amount.
      const counterpart =
        product.billingCycle === "yearly" ? getMonthlyCounterpartCode(product.code) : null;
      const monthly = counterpart ? byCode.get(counterpart) : null;
      const savingPercent =
        product.billingCycle === "yearly"
          ? yearlySavingPercent(
              monthly ? { amountSubunits: monthly.amountPaise, currency: monthly.currency } : null,
              { amountSubunits: product.amountPaise, currency: product.currency },
            )
          : null;

      return {
        product,
        label: planName,
        price: formatCurrency(product.amountPaise, product.currency),
        suffix:
          product.billingCycle === "monthly"
            ? "/ month"
            : product.billingCycle === "yearly"
              ? "/ year"
              : "",
        savingPercent,
      };
    });
  }, [snapshot?.billing.catalog, selectedProduct]);

  /**
   * Whether the other family of products exists, so the card can offer a way
   * across.
   *
   * The rows list one family at a time - cycles of a plan, or amounts of a
   * top-up - which is what the design shows. But /billing is now a direct
   * entry point from the plugin and from discount links, and it opens on
   * whatever the catalogue lists first, which is always a top-up. Without this
   * switch a customer who landed there could never reach a subscription, and
   * subscriptions are the only thing a discount code applies to.
   */
  const otherFamily = useMemo(() => {
    const catalog = snapshot?.billing.catalog || [];
    if (!selectedProduct) return null;
    const wantSubscription = selectedProduct.kind !== "subscription";
    const target = catalog.find((product) => (product.kind === "subscription") === wantSubscription);
    if (!target) return null;
    return {
      code: target.code,
      label: wantSubscription ? "Looking for a plan instead?" : "Just need credits instead?",
      action: wantSubscription ? "See subscription plans" : "See credit top-ups",
    };
  }, [snapshot?.billing.catalog, selectedProduct]);

  const selectedOption = useMemo(
    () => planOptions.find((option) => option.product.code === selectedCode) || null,
    [planOptions, selectedCode],
  );

  const planSubtitle = useMemo(() => {
    if (!selectedProduct) return "Pick a plan or top up credits.";
    if (selectedProduct.billingCycle === "monthly") return "Monthly Plan";
    if (selectedProduct.billingCycle === "yearly") return "Yearly Plan";
    return "One-time purchase";
  }, [selectedProduct]);

  /**
   * The single path from this page to Razorpay.
   *
   * The code is re-priced at click time rather than trusted from state: a
   * balance can move between applying a code and pressing this, and a stale
   * quote is exactly what the server's guard rejects.
   */
  async function handleContinue() {
    if (!selectedProduct) return;
    if (selectedProduct.kind !== "subscription") {
      void handleOrderCheckout(selectedProduct);
      return;
    }
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      void handleSubscriptionCheckout(selectedProduct, undefined, null);
      return;
    }
    const quote = couponQuote?.code === code ? couponQuote : await checkCoupon(selectedProduct, code);
    if (!quote) {
      // A bare `return` here made the button do visibly nothing, forever: a
      // customer who had already used their one allowance arrived with the code
      // prefilled from the URL, could not clear it without noticing the Remove
      // control, and every press of Continue was silently swallowed.
      //
      // It deliberately does NOT fall through to a full-price checkout. That
      // would open Razorpay at an amount they were never shown, which is the one
      // thing this page must never do.
      setStatus(
        `${code} could not be applied, so nothing has been charged. Remove the code to continue at the full price.`,
      );
      return;
    }
    void handleSubscriptionCheckout(selectedProduct, code, quote);
  }

  /**
   * Ask what this customer could use, for the plan they have selected.
   *
   * Re-asked on every plan change because the discount is priced against one
   * product, and skipped entirely once a code is applied - the applied banner
   * replaces this one, and re-querying would be work whose answer is discarded.
   */
  useEffect(() => {
    if (!selectedProduct || selectedProduct.kind !== "subscription" || couponQuote) {
      setBestOffer(null);
      return;
    }
    let live = true;
    void (async () => {
      try {
        const response = await fetch("/api/billing/coupons/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productCode: selectedProduct.code }),
        });
        const payload = (await response.json()) as { offer?: typeof bestOffer };
        if (live) setBestOffer(response.ok ? payload.offer ?? null : null);
      } catch {
        // The banner is an invitation, not a requirement. A failure here must
        // not disturb a checkout that is otherwise fine.
        if (live) setBestOffer(null);
      }
    })();
    return () => {
      live = false;
    };
  }, [selectedProduct, couponQuote]);

  // A menu that only closes by choosing something is a trap on touch, and one
  // that stays open behind a payment sheet is worse.
  useEffect(() => {
    if (!planMenuOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!planMenuRef.current?.contains(event.target as Node)) setPlanMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlanMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [planMenuOpen]);

  async function handleCancelSubscription() {
    setBusyCode("cancel");
    setStatus("Scheduling cancellation at cycle end...");

    try {
      const response = await fetch("/api/billing/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as { error?: string; willCancelAt?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to cancel subscription.");
      }

      await Promise.all([refreshCurrentSubscription(), refreshSnapshot()]);
      setStatus(
        payload.willCancelAt
          ? `Cancellation scheduled for ${formatDate(payload.willCancelAt)}.`
          : "Cancellation scheduled.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to cancel subscription.");
    } finally {
      setBusyCode(null);
    }
  }

  // A verified payment replaces the checkout entirely. Leaving the form behind
  // it is how someone pays twice.
  if (completedOrder) return <OrderComplete {...completedOrder} />;

  const wallet = snapshot?.billing.wallet.availableCredits ?? null;
  const selectedCredits = selectedProduct
    ? selectedProduct.creditsGranted + selectedProduct.bonusCredits
    : null;
  // The same four lines the customer read on the plan card they clicked. The
  // hardcoded list here described a generic plan, so the benefits changed
  // wording between /pricing and checkout for no reason.
  const benefits =
    selectedProduct?.kind === "subscription"
      ? getPlanUi(selectedProduct.code)?.features ?? SUBSCRIPTION_BENEFITS
      : TOPUP_BENEFITS;
  const isSubscription = selectedProduct?.kind === "subscription";

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-secondary-db-100">

      <Image
        src="/icons/logo-black.svg"
        alt="Waysorted"
        width={132}
        height={32}
        priority
        className="h-8 w-auto"
      />

      <div className="mx-auto mt-6 w-full max-w-[400px] pb-10">
        <section className="rounded-[20px] bg-white p-5 shadow-[0_10px_40px_rgba(15,18,28,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[19px] font-semibold leading-[24px] tracking-[-0.01em] text-[#17171C]">
                {selectedProduct
                  ? isSubscription
                    ? `Subscribing to ${getPlanUi(selectedProduct.code)?.planName || selectedProduct.name}`
                    : selectedProduct.name
                  : "Choose a plan"}
              </h1>
              <p className="mt-[3px] text-[14px] text-[#8B8B94]">{planSubtitle}</p>
            </div>
            {selectedCredits !== null ? (
              <span className="inline-flex h-[26px] shrink-0 items-center gap-[6px] rounded-full bg-[#EFEBFE] px-[10px] text-[12px] font-medium text-[#6D3BEB]">
                <CreditsIcon />
                {selectedCredits.toLocaleString()} credits
              </span>
            ) : null}
          </div>

          <div className="mt-[17px] h-px w-full bg-[#EAEAEF]" />

          <div className="mt-[11px] flex items-center justify-between gap-3 text-[15px]">
            <span className="text-[#4A4A55]">Credits Remaining</span>
            <span className="font-medium text-[#17171C]">
              {wallet === null ? "--" : `${wallet.toLocaleString()} credits`}
            </span>
          </div>

          <div className="mt-[14px] rounded-[12px] bg-[#F6F7FB] px-5 pb-[15px] pt-[16px]">
            <div className="text-[15px] font-semibold text-[#17171C]">
              {isSubscription ? "Plan Benefits" : "What you get"}
            </div>
            <ul className="mt-[16px] space-y-[10px]">
              {benefits.map((benefit: string) => (
                <li key={benefit} className="flex items-start gap-[10px] text-[15px] leading-[18px] text-[#3E3E49]">
                  <BenefitCheck />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {planOptions.length > 1 ? (
            <>
              <h2 className="mt-[13px] text-[16px] font-semibold leading-[20px] text-[#17171C]">
                {isSubscription ? "Want to Upgrade Plan?" : "Choose an amount"}
              </h2>
              <p className="mt-[6px] text-[14px] text-[#8B8B94]">
                {isSubscription
                  ? "Upgrade to Yearly Plan and Save higher"
                  : "Pick the top-up that suits you"}
              </p>

              {/*
                A dropdown, not a stack of rows.
                
                The design has two plans; the real catalogue has six, and six
                46px rows pushed the discount-code banner and the status line
                clean off the first screen - the offer was there and nobody
                could see it. The menu overlays rather than expands, so opening
                it never moves what is underneath.
              */}
              <div ref={planMenuRef} className="relative mt-[20px]">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={planMenuOpen}
                  aria-label={`Plan: ${selectedOption?.label ?? "none"}. Change plan`}
                  onClick={() => setPlanMenuOpen((open) => !open)}
                  disabled={busyCode !== null}
                  className="flex h-[46px] w-full items-center gap-[12px] rounded-[12px] border-2 border-[#7C3AED] bg-[#F3F0FE] px-[14px] text-left transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  <PlanRadio selected />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#17171C]">
                    {selectedOption?.label ?? "Choose a plan"}
                  </span>
                  {selectedOption?.savingPercent ? (
                    <span className="shrink-0 rounded-[5px] bg-[#2E9E52] px-[7px] py-[3px] text-[11px] font-semibold text-white">
                      {selectedOption.savingPercent}% OFF
                    </span>
                  ) : null}
                  {selectedOption ? (
                    <span className="shrink-0 text-[15px] text-[#6E6E78]">
                      <span className="text-[16px] font-semibold text-[#17171C]">
                        {selectedOption.price}
                      </span>
                      {selectedOption.suffix}
                    </span>
                  ) : null}
                  <ChevronDown open={planMenuOpen} />
                </button>

                {planMenuOpen ? (
                  <ul
                    role="listbox"
                    aria-label="Available plans"
                    className="absolute left-0 right-0 top-[52px] z-30 max-h-[280px] space-y-[4px] overflow-y-auto rounded-[12px] border border-[#E6E6EC] bg-white p-[6px] shadow-[0_16px_40px_rgba(15,18,28,0.16)]"
                  >
                    {planOptions.map((option) => {
                      const isSelected = option.product.code === selectedCode;
                      return (
                        <li key={option.product.code}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedCode(option.product.code);
                              setPlanMenuOpen(false);
                              // A code is priced against ONE product. Carrying
                              // the quote across a plan change would show a
                              // discount the server's guard then rejects at
                              // checkout.
                              setCouponQuote(null);
                              setCouponError(null);
                            }}
                            className={`flex h-[42px] w-full items-center gap-[10px] rounded-[9px] px-[10px] text-left transition-colors duration-150 ${
                              isSelected ? "bg-[#F3F0FE]" : "hover:bg-[#F4F4F7]"
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#17171C]">
                              {option.label}
                            </span>
                            {option.savingPercent ? (
                              <span className="shrink-0 rounded-[5px] bg-[#2E9E52] px-[7px] py-[3px] text-[11px] font-semibold text-white">
                                {option.savingPercent}% OFF
                              </span>
                            ) : null}
                            <span className="shrink-0 text-[14px] text-[#6E6E78]">
                              <span className="text-[15px] font-semibold text-[#17171C]">
                                {option.price}
                              </span>
                              {option.suffix}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </>
          ) : null}

          {otherFamily ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCode(otherFamily.code);
                setCouponQuote(null);
                setCouponError(null);
              }}
              className="mt-[12px] text-[13px] text-[#6D3BEB] underline underline-offset-2 transition-opacity hover:opacity-70"
            >
              {otherFamily.label} {otherFamily.action}
            </button>
          ) : null}

          {/*
            Rendered outside the subscription-only banner below. A code refused
            because the selected product is a top-up produced an error that was
            only ever mounted inside that banner, so the customer saw no trace of
            the code they had been sent.
          */}
          {couponError && !isSubscription ? (
            <div
              role="alert"
              className="mt-[14px] rounded-[12px] bg-[#FDF0E7] px-4 py-3 text-[13px] text-[#9A3412]"
            >
              <p>{couponError}</p>
              <button
                type="button"
                onClick={() => {
                  setCouponInput("");
                  setCouponError(null);
                  setCouponQuote(null);
                }}
                className="mt-[6px] font-semibold underline underline-offset-2"
              >
                Remove code and continue
              </button>
            </div>
          ) : null}

          {bridgeExpired ? (
            <div
              role="status"
              className="mt-[14px] rounded-[12px] bg-[#F6F7FB] px-4 py-3 text-[13px] text-[#4A4A55]"
            >
              That checkout link had expired, so we brought you straight here. Nothing has been
              charged.
            </div>
          ) : null}

          {quoteDrift && selectedProduct ? (
            <div
              role="alert"
              className="mt-[16px] rounded-[12px] border border-[#F5D9A8] bg-[#FFF8EC] px-4 py-3 text-[13px] text-[#7A5B1E]"
            >
              <p className="font-semibold text-[#8A5A00]">The price for this plan has changed.</p>
              <p className="mt-1">
                You were shown{" "}
                <span className="font-semibold">
                  {formatCurrency(quoteDrift.amountPaise, quoteDrift.currency)}
                </span>
                . Based on your account it is now{" "}
                <span className="font-semibold">
                  {formatCurrency(selectedProduct.amountPaise, selectedProduct.currency)}
                </span>
                . Nothing has been charged. Review the amount and continue only if you agree.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              // Inside the gesture, which is the only place a browser will let
              // an AudioContext start. The receipt's printer sound is created
              // minutes later, by which time no gesture is in scope and the
              // context would be refused - so it is warmed here and reused.
              unlockPrinterAudio();
              void handleContinue();
            }}
            disabled={!selectedProduct || busyCode !== null || paidOrderId !== null}
            className="mt-[25px] flex h-[40px] w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-b from-[#2C2450] to-[#191233] text-[15px] font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {busyCode ? (
              "Processing..."
            ) : (
              <>
                Continue to
                <RazorpayWordmark />
              </>
            )}
          </button>

          {/*
            The design's "Special offer!" banner is where a discount code lives.
            Once a code is priced it becomes the confirmation of what will be
            charged - both the first cycle and the recurring amount - so the
            arrangement is stated here as well as on Razorpay's own sheet.
          */}
          {isSubscription ? (
            couponQuote ? (
              <div className="mt-[21px] rounded-[12px] bg-[#E8F6EE] px-4 py-[14px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#12673B]">
                      {couponQuote.code} applied - {couponQuote.percent}% off
                    </div>
                    <p className="mt-[4px] text-[13px] leading-[1.5] text-[#276B4A]">
                      {formatCurrency(couponQuote.upfrontSubunits, couponQuote.currency)} for your
                      first {selectedProduct?.billingCycle === "yearly" ? "year" : "month"}, then{" "}
                      {formatCurrency(couponQuote.recurringSubunits, couponQuote.currency)}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponInput("");
                      setCouponQuote(null);
                      setCouponError(null);
                    }}
                    className="shrink-0 text-[13px] font-semibold text-[#276B4A] underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative mt-[21px] overflow-hidden rounded-[12px] bg-[#F7E7A4] px-4 py-[14px]">
                <SpecialOfferGlyph />
                <div className="relative">
                  <div className="text-[15px] font-bold text-[#3D3312]">
                    {bestOffer ? `${bestOffer.percent}% off your first ${
                      selectedProduct?.billingCycle === "yearly" ? "year" : "month"
                    }` : "Special offer!"}
                  </div>
                  {/*
                    Resolved server-side for THIS customer and THIS plan. The
                    copy here used to be fixed - "Spend 30 credits and a discount
                    code unlocks automatically" - which matched neither the real
                    balance thresholds nor whether any code was switched on. Now
                    it only ever names a code that would actually be honoured,
                    and says nothing when there is nothing to offer.
                  */}
                  <p className="mt-[4px] max-w-[250px] text-[13px] leading-[1.5] text-[#5A4B1A]">
                    {bestOffer
                      ? `Use ${bestOffer.code} and pay ${formatCurrency(
                          bestOffer.upfrontSubunits,
                          bestOffer.currency,
                        )} instead of ${formatCurrency(
                          bestOffer.recurringSubunits,
                          bestOffer.currency,
                        )}.`
                      : "Have a discount code? Enter it below."}
                  </p>
                  {bestOffer && couponInput.trim().toUpperCase() !== bestOffer.code ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponInput(bestOffer.code);
                        if (selectedProduct) void checkCoupon(selectedProduct, bestOffer.code);
                      }}
                      className="mt-[10px] rounded-[9px] bg-[#3D3312] px-4 py-[7px] text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
                    >
                      Apply {bestOffer.code}
                    </button>
                  ) : null}
                  <div className="mt-[12px] flex max-w-[250px] gap-2">
                    <label htmlFor="coupon-code" className="sr-only">
                      Discount code
                    </label>
                    <input
                      id="coupon-code"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value.toUpperCase());
                        // Any edit invalidates the previous answer. Leaving a
                        // stale quote on screen while the field says something
                        // else is how a customer expects one price and is
                        // quoted another.
                        setCouponError(null);
                        setCouponQuote(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && selectedProduct) {
                          event.preventDefault();
                          void checkCoupon(selectedProduct, couponInput);
                        }
                      }}
                      placeholder="Enter code"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-[36px] min-w-0 flex-1 rounded-[9px] border border-[#E2CE7E] bg-white px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#3D3312] outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[#A79552] focus:border-[#B99B2A]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProduct) void checkCoupon(selectedProduct, couponInput);
                      }}
                      disabled={!couponInput.trim() || couponChecking || !selectedProduct}
                      className="h-[36px] shrink-0 rounded-[9px] bg-[#3D3312] px-4 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {couponChecking ? "Checking..." : "Apply"}
                    </button>
                  </div>
                  {couponError ? (
                    <p className="mt-[8px] text-[13px] font-medium text-[#9A3412]">{couponError}</p>
                  ) : null}
                </div>
              </div>
            )
          ) : null}

          <p className="mt-[14px] text-center text-[12px] leading-[1.5] text-[#8B8B94]" role="status">
            {status}
          </p>
        </section>

        {shouldShowSubscriptionPanel ? (
          <section className="mt-4 rounded-[16px] border border-[#E6E6EC] bg-white px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-[#17171C]">Subscription</div>
                <div className="mt-[2px] text-[12px] text-[#8B8B94]">
                  {snapshot?.billing.subscription.status || "NA"}
                  {snapshot?.billing.subscription.renewsAt
                    ? ` - renews ${formatDate(snapshot.billing.subscription.renewsAt)}`
                    : ""}
                </div>
              </div>
              {currentSubscription ? (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={busyCode === "cancel" || currentSubscription.cancelAtCycleEnd}
                  className="rounded-[10px] border border-[#E6E6EC] bg-[#F6F7FB] px-4 py-2 text-[12px] font-semibold text-[#4A4A55] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {currentSubscription.cancelAtCycleEnd ? "Cancellation scheduled" : "Cancel subscription"}
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function CreditsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.6" stroke="#6D3BEB" strokeWidth="1.3" />
      <circle cx="7" cy="7" r="2.1" fill="#6D3BEB" />
    </svg>
  );
}

function BenefitCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="mt-[1px] shrink-0">
      <rect width="18" height="18" rx="9" fill="#EFEBFE" />
      <path
        d="M5.2 9.2L7.7 11.6L12.8 6.4"
        stroke="#6D3BEB"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6l4 4 4-4" stroke="#17171C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanRadio({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-[16px] w-[16px] shrink-0 rounded-full ${
        selected ? "border-[4.5px] border-[#7C3AED] bg-white" : "border border-[#D6D6DD] bg-white"
      }`}
    />
  );
}

/**
 * The processor's name on the button that hands the customer over to it.
 *
 * Deliberately the WORDMARK ONLY. This drew a hand-approximated version of
 * Razorpay's symbol, which was simply wrong - and a wrong trademark on a
 * payment button is worse than no symbol at all, because it undermines exactly
 * the trust the logo is there to provide.
 *
 * To restore the symbol, export `razorpay-icon` from the checkout frame in
 * Figma to `public/icons/razorpay.svg` and render it here beside the word. The
 * wordmark is upright, not italic.
 */
function RazorpayWordmark() {
  return <span className="text-[15px] font-bold tracking-[-0.01em]">Razorpay</span>;
}

/** The soft sparkle graphic in the corner of the offer banner. */
function SpecialOfferGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 90"
      className="pointer-events-none absolute -bottom-2 right-0 h-[86px] w-[120px]"
    >
      <ellipse cx="72" cy="74" rx="46" ry="26" fill="#F0DA8A" />
      <path d="M104 18l6 22-24-6 18-16z" fill="#EFD87F" />
      <path
        d="M84 30l2.6 6.4L93 39l-6.4 2.6L84 48l-2.6-6.4L75 39l6.4-2.6L84 30z"
        fill="#FFFFFF"
        fillOpacity="0.9"
      />
      <path
        d="M102 52l1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3-4.3-1.7 4.3-1.7 1.7-4.3z"
        fill="#FFFFFF"
        fillOpacity="0.8"
      />
    </svg>
  );
}
