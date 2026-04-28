"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const digits = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits ?? 2;
  return 10 ** digits;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription["subscription"] | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialProductCode);
  const [status, setStatus] = useState("Loading billing...");
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const query = bridgeToken ? `?bridge=${encodeURIComponent(bridgeToken)}` : "";
  const redirectPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const selectedProduct = useMemo(
    () => snapshot?.billing.catalog.find((product) => product.code === selectedCode) || null,
    [selectedCode, snapshot?.billing.catalog],
  );

  const refreshSnapshot = useCallback(async () => {
    const separator = query ? "&" : "?";
    const response = await fetch(`/api/billing/snapshot${query}${separator}ts=${Date.now()}`, { cache: "no-store" });
    const payload = (await response.json()) as BillingSnapshot | { error?: string };
    if (!response.ok || !("billing" in payload)) {
      if (response.status === 401 && !bridgeToken) {
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
      throw new Error(("error" in payload && payload.error) || "Unable to load billing snapshot.");
    }
    setSnapshot(payload);
    if (!selectedCode && payload.billing.catalog.length > 0) {
      setSelectedCode(payload.billing.catalog[0].code);
    }
    return payload;
  }, [bridgeToken, query, redirectPath, router, selectedCode]);

  const refreshCurrentSubscription = useCallback(async () => {
    const separator = query ? "&" : "?";
    const response = await fetch(`/api/billing/subscriptions/current${query}${separator}ts=${Date.now()}`, {
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
    <main className="min-h-screen bg-[#F5F7FC] px-4 py-8 text-secondary-db-100 sm:px-6">
      <div className="mx-auto max-w-[880px]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Billing</h1>
            <p className="mt-1 text-sm text-[#687184]">Choose a plan or top up credits.</p>
          </div>
          <div className="rounded-xl border border-[#E7EDF7] bg-white px-4 py-3 text-right">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7A8499]">Credits</div>
            <div className="mt-1 text-2xl font-semibold">{snapshot?.billing.wallet.availableCredits ?? "--"}</div>
          </div>
        </div>

        <section className="rounded-2xl border border-[#E7EDF7] bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot?.billing.catalog.map((product) => {
              const totalCredits = product.creditsGranted + product.bonusCredits;
              const isSelected = selectedCode === product.code;

              return (
                <button
                  key={product.code}
                  type="button"
                  onClick={() => setSelectedCode(product.code)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
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
        </section>

        <section className="mt-4 rounded-2xl border border-[#E7EDF7] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{selectedProduct?.name || "Select an item"}</div>
              <div className="mt-1 text-xs text-[#687184]">
                {selectedProduct
                  ? `${formatCurrency(selectedProduct.amountPaise, selectedProduct.currency)} · ${
                      selectedProduct.creditsGranted + selectedProduct.bonusCredits
                    } credits`
                  : "No item selected"}
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
                disabled={busyCode === selectedProduct.code}
                className="rounded-xl bg-[#356DFF] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyCode === selectedProduct.code
                  ? "Processing..."
                  : selectedProduct.kind === "subscription"
                    ? "Start subscription"
                    : "Buy credits"}
              </button>
            ) : null}
          </div>
          <div className="mt-4 rounded-xl bg-[#F8FAFF] px-4 py-3 text-xs text-[#687184]">{status}</div>
        </section>

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
      </div>
    </main>
  );
}
