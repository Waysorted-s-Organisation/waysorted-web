"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type CatalogProduct = {
  code: string;
  name: string;
  kind: "starter" | "topup" | "subscription";
  eligibility: string;
  priceInr: number;
  amountPaise: number;
  creditsGranted: number;
  bonusCredits: number;
  billingCycle: "one_time" | "yearly";
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
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }).Razorpay;
}

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only run in the browser."));
  }

  if (getRazorpayConstructor()) return Promise.resolve();

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay."));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function minorUnitMultiplier(currency: string) {
  if (currency === "JPY") return 1;
  if (currency === "KWD") return 1000;
  return 100;
}

function formatCurrency(amountSubunits: number, currency = "INR") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amountSubunits / minorUnitMultiplier(currency));
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
  bridgeToken,
  initialProductCode,
}: {
  bridgeToken: string | null;
  initialProductCode: string | null;
}) {
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription["subscription"] | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialProductCode);
  const [status, setStatus] = useState("Loading billing...");
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const query = bridgeToken ? `?bridge=${encodeURIComponent(bridgeToken)}` : "";

  const selectedProduct = useMemo(
    () => snapshot?.billing.catalog.find((product) => product.code === selectedCode) || null,
    [selectedCode, snapshot?.billing.catalog],
  );

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch(`/api/billing/snapshot${query}`, { cache: "no-store" });
    const payload = (await response.json()) as BillingSnapshot | { error?: string };
    if (!response.ok || !("billing" in payload)) {
      throw new Error(("error" in payload && payload.error) || "Unable to load billing snapshot.");
    }
    setSnapshot(payload);
    if (!selectedCode && payload.billing.catalog.length > 0) {
      setSelectedCode(payload.billing.catalog[0].code);
    }
    return payload;
  }, [query, selectedCode]);

  const refreshCurrentSubscription = useCallback(async () => {
    const response = await fetch(`/api/billing/subscriptions/current${query}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as CurrentSubscription | { error?: string };
    if (response.ok && "subscription" in payload) {
      setCurrentSubscription(payload.subscription);
    }
  }, [query]);

  useEffect(() => {
    loadRazorpayScript().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Unable to load Razorpay.");
    });

    Promise.all([refreshSnapshot(), refreshCurrentSubscription()])
      .then(() => setStatus("Billing ready."))
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Unable to load billing.");
      });
  }, [refreshCurrentSubscription, refreshSnapshot]);

  async function handleOrderCheckout(product: CatalogProduct) {
    setBusyCode(product.code);
    setStatus(`Creating order for ${product.name}...`);

    try {
      const response = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: product.code,
          bridgeToken,
          idempotencyKey: `billing-page:${product.code}:${Date.now()}`,
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
        throw new Error(("error" in payload && payload.error) || "Unable to create order.");
      }

      const Razorpay = getRazorpayConstructor();
      if (!Razorpay) {
        throw new Error("Razorpay checkout did not initialize.");
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
          setStatus("Payment received. Verifying signature and waiting for webhook sync...");
          await fetch("/api/billing/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bridgeToken,
              purchaseId: payload.purchaseId,
              orderId: payload.orderId,
              ...checkoutResponse,
            }),
          });

          await new Promise((resolve) => setTimeout(resolve, 1200));
          await refreshSnapshot();
          setStatus("Payment submitted. Credits will only finalize after webhook confirmation.");
          setBusyCode(null);
        },
      });

      checkout.open();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkout failed.");
      setBusyCode(null);
    }
  }

  async function handleSubscriptionCheckout(product: CatalogProduct) {
    setBusyCode(product.code);
    setStatus(`Creating subscription for ${product.name}...`);

    try {
      const response = await fetch("/api/billing/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: product.code,
          bridgeToken,
          idempotencyKey: `billing-page:subscription:${product.code}:${Date.now()}`,
        }),
      });

      const payload = (await response.json()) as
        | {
            subscriptionId: string;
            key: string;
          }
        | { error?: string };

      if (!response.ok || !("subscriptionId" in payload)) {
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
        handler: async () => {
          setStatus("Subscription payment submitted. Waiting for Razorpay webhook sync...");

          for (let index = 0; index < 6; index += 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await refreshCurrentSubscription();
            const latestSnapshot = await refreshSnapshot();
            if (latestSnapshot.billing.subscription.status !== "payment_pending") {
              break;
            }
          }

          setBusyCode(null);
          setStatus("Subscription submitted. Final entitlement remains webhook-driven.");
        },
      });

      checkout.open();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription checkout failed.");
      setBusyCode(null);
    }
  }

  async function handleCancelSubscription() {
    setBusyCode("cancel");
    setStatus("Scheduling cancellation at cycle end...");

    try {
      const response = await fetch("/api/billing/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bridgeToken }),
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
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-10 text-[#111827] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#265BD1]">
              Internal Billing Route
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Waysorted Billing</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#4b5563]">
              Payments, subscriptions, credits, and cancellation are all backend-authoritative. This
              route is intended to be opened directly or via plugin checkout redirect.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dbe3f1] bg-white px-4 py-3 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-[#6b7280]">Wallet</div>
            <div className="mt-1 text-2xl font-semibold">
              {snapshot?.billing.wallet.availableCredits ?? "--"}
            </div>
            <div className="text-sm text-[#6b7280]">
              Held: {snapshot?.billing.wallet.heldCredits ?? "--"}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-[#dbe3f1] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Available Plans</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Starter packs are available only until the first successful paid purchase. Subscription
              cancellation remains end-of-cycle and does not auto-refund the current cycle.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {snapshot?.billing.catalog.map((product) => {
                const totalCredits = product.creditsGranted + product.bonusCredits;
                const isSelected = selectedCode === product.code;

                return (
                  <button
                    key={product.code}
                    type="button"
                    onClick={() => setSelectedCode(product.code)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#265BD1] bg-[#edf3ff] shadow-[0_10px_30px_rgba(38,91,209,0.12)]"
                        : "border-[#e5e7eb] bg-[#fafbfc]"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-[0.16em] text-[#6b7280]">
                      {product.kind}
                    </div>
                    <div className="mt-2 text-lg font-semibold">{product.name}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">
                      {formatCurrency(product.amountPaise, product.currency)} for {totalCredits} credits
                    </div>
                    {product.bonusCredits > 0 ? (
                      <div className="mt-2 text-xs text-[#265BD1]">
                        Includes {product.bonusCredits} bonus credits
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-[#dbe3f1] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Subscription Status</h2>
            <div className="mt-4 space-y-2 text-sm text-[#374151]">
              <div>
                Pricing: {snapshot?.billing.pricing.countryName || "NA"} /{" "}
                {snapshot?.billing.pricing.tier?.replace("_", " ") || "NA"} /{" "}
                {snapshot?.billing.pricing.currency || "NA"}
              </div>
              <div>Status: {snapshot?.billing.subscription.status || "NA"}</div>
              <div>Plan: {snapshot?.billing.subscription.planCode || "NA"}</div>
              <div>Renews: {formatDate(snapshot?.billing.subscription.renewsAt)}</div>
              <div>Cancels on: {formatDate(snapshot?.billing.subscription.willCancelAt)}</div>
            </div>

            {currentSubscription ? (
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={busyCode === "cancel" || currentSubscription.cancelAtCycleEnd}
                className="mt-5 w-full rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {currentSubscription.cancelAtCycleEnd ? "Cancellation Scheduled" : "Cancel At Cycle End"}
              </button>
            ) : null}

            <div className="mt-6 rounded-2xl bg-[#f7f9fc] p-4 text-sm text-[#4b5563]">
              <div className="font-medium text-[#111827]">Status</div>
              <div className="mt-1">{status}</div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-[#dbe3f1] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Selected Checkout</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Credits grant only after provider-confirmed backend reconciliation.
              </p>
            </div>
            {selectedProduct ? (
              <button
                type="button"
                onClick={() =>
                  selectedProduct.kind === "subscription"
                    ? handleSubscriptionCheckout(selectedProduct)
                    : handleOrderCheckout(selectedProduct)
                }
                disabled={busyCode === selectedProduct.code}
                className="rounded-2xl bg-[#265BD1] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyCode === selectedProduct.code
                  ? "Processing..."
                  : selectedProduct.kind === "subscription"
                    ? "Start Subscription"
                    : "Buy Credits"}
              </button>
            ) : null}
          </div>

          {selectedProduct ? (
            <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f9fc] p-5 md:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6b7280]">Product</div>
                <div className="mt-1 font-medium">{selectedProduct.name}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6b7280]">Amount</div>
                <div className="mt-1 font-medium">
                  {formatCurrency(selectedProduct.amountPaise, selectedProduct.currency)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6b7280]">Credits</div>
                <div className="mt-1 font-medium">
                  {selectedProduct.creditsGranted + selectedProduct.bonusCredits}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6b7280]">Cycle</div>
                <div className="mt-1 font-medium">{selectedProduct.billingCycle}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-[#6b7280]">No eligible catalog item available right now.</div>
          )}
        </section>
      </div>
    </main>
  );
}
