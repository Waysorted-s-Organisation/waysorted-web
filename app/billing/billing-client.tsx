"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/billing/money";

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
  const [scriptReady, setScriptReady] = useState(false);
  const [showCatalog, setShowCatalog] = useState(!initialProductCode);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const autostartedRef = useRef(false);
  const checkoutAttemptKeysRef = useRef(new Map<string, string>());

  const redirectPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

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

  const hasChosenProduct = Boolean(selectedProduct);
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
      setSelectedCode(payload.billing.catalog[0].code);
    }
    return payload;
  }, [redirectPath, router, selectedCode]);

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
      setShowCatalog(true);
      setStatus("That plan is not available on your account. Pick an available option below.");
    }
  }, [initialProductCode, snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    if (!["active", "cancel_scheduled", "payment_pending"].includes(snapshot.billing.subscription.status)) return;

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

  const handleSubscriptionCheckout = useCallback(async (product: CatalogProduct) => {
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
          quotedAmountSubunits: product.amountPaise,
          quotedCurrency: product.currency,
          pricingVersion: snapshot?.billing.pricingVersion,
        }),
      });

      const payload = (await response.json()) as
        | {
            purchaseId: string;
            subscriptionId: string;
            key: string;
          }
        | { error?: string };

      if (!response.ok || !("subscriptionId" in payload)) {
        // See handleOrderCheckout: a price change is a decision point, not a failure.
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
              paymentId?: string;
              error?: string;
            };
            if (!verifyResponse.ok || verification.verified !== true) {
              throw new Error(verification.error || "Unable to verify subscription payment.");
            }

            checkoutAttemptKeysRef.current.delete(product.code);
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
      setShowCatalog(true);
      return;
    }

    autostartedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("autostart")) {
      params.delete("autostart");
      router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    }
    void (selectedProduct.kind === "subscription"
      ? handleSubscriptionCheckout(selectedProduct)
      : handleOrderCheckout(selectedProduct));
  }, [
    autostart,
    busyCode,
    handleOrderCheckout,
    handleSubscriptionCheckout,
    pathname,
    quoteDrift,
    router,
    scriptReady,
    searchParams,
    selectedProduct,
  ]);

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

  return (
    <main className="min-h-screen bg-[#F5F7FC] px-4 py-8 text-secondary-db-100 sm:px-6">
      <div className="mx-auto max-w-[880px]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold tracking-[-0.02em]">Secure checkout</h1>
            <p className="mt-1 text-sm text-[#687184]">
              {hasChosenProduct ? "Review the selected plan and continue to Razorpay." : "Choose a plan or top up credits."}
            </p>
          </div>
          <div className="rounded-full border border-[#E7EDF7] bg-white px-4 py-2 text-xs font-medium text-[#5E6A7B]">
            Available credits: <span className="font-semibold text-secondary-db-100">{snapshot?.billing.wallet.availableCredits ?? "--"}</span>
          </div>
        </div>

        <section className="rounded-[26px] border border-[#E7EDF7] bg-white p-5 shadow-[0_12px_34px_rgba(13,18,24,0.04)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8499]">Selected item</div>
              <div className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-secondary-db-100">
                {selectedProduct?.name || "Select a product"}
              </div>
              <div className="mt-2 text-sm text-[#687184]">
                {selectedProduct
                  ? `${formatCurrency(selectedProduct.amountPaise, selectedProduct.currency)} · ${
                      selectedProduct.creditsGranted + selectedProduct.bonusCredits
                    } credits`
                  : "Choose a plan below to continue."}
              </div>
            </div>
            {selectedProduct ? (
              <button
                type="button"
                onClick={() =>
                  selectedProduct.kind === "subscription"
                    ? handleSubscriptionCheckout(selectedProduct)
                    : handleOrderCheckout(selectedProduct)
                }
                disabled={busyCode === selectedProduct.code || paidOrderId !== null}
                className="rounded-2xl bg-[#356DFF] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(53,109,255,0.22)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {busyCode === selectedProduct.code
                  ? "Processing..."
                  : selectedProduct.kind === "subscription"
                    ? "Continue to Razorpay"
                    : "Continue to Razorpay"}
              </button>
            ) : null}
          </div>

          {quoteDrift && selectedProduct ? (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-[#F5D9A8] bg-[#FFF8EC] px-4 py-3 text-xs text-[#7A5B1E]"
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

          <div className="mt-4 rounded-2xl border border-[#EEF2FA] bg-[#F8FAFF] px-4 py-3 text-xs text-[#687184]">
            {status}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCatalog((value) => !value)}
              className="rounded-full border border-[#DCE5FF] bg-[#EDF2FF] px-4 py-2 text-xs font-semibold text-[#2E56CC] transition-colors duration-200 hover:bg-[#E3ECFF]"
            >
              {showCatalog ? "Hide other plans" : "Change plan"}
            </button>
            {autostart && !quoteDrift ? (
              <span className="text-xs text-[#7A8499]">Checkout opens automatically when ready.</span>
            ) : null}
          </div>

          {showCatalog ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {snapshot?.billing.catalog.map((product) => {
                const totalCredits = product.creditsGranted + product.bonusCredits;
                const isSelected = selectedCode === product.code;

                return (
                  <button
                    key={product.code}
                    type="button"
                    onClick={() => setSelectedCode(product.code)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                      isSelected ? "border-[#356DFF] bg-[#EEF3FF]" : "border-[#E7EDF7] bg-[#F8FAFF]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{product.name}</div>
                        <div className="mt-1 text-xs text-[#687184]">{totalCredits.toLocaleString()} credits</div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold">
                        {formatCurrency(product.amountPaise, product.currency)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        {shouldShowSubscriptionPanel ? (
          <section className="mt-4 rounded-2xl border border-[#E7EDF7] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Subscription</div>
                <div className="mt-1 text-xs text-[#687184]">
                  {snapshot?.billing.subscription.status || "NA"}
                  {snapshot?.billing.subscription.renewsAt
                    ? ` · renews ${formatDate(snapshot.billing.subscription.renewsAt)}`
                    : ""}
                </div>
              </div>
              {currentSubscription ? (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={busyCode === "cancel" || currentSubscription.cancelAtCycleEnd}
                  className="rounded-xl border border-[#DCE5FF] bg-[#EDF2FF] px-4 py-2 text-xs font-semibold text-[#2E56CC] disabled:cursor-not-allowed disabled:opacity-60"
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
