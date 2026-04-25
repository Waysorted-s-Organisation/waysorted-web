"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBanner } from "@/context/BannerContext";
import { useUser } from "@/hooks/useUser";
import { PLAN_CATALOG, isBillingCycle, isPlanId } from "@/lib/payments/plans";
import type {
  BillingCycle,
  PaymentOrderResponse,
  PaymentVerifyResponse,
  PlanId,
} from "@/types/payment";

type CheckoutState =
  | "idle"
  | "creating_order"
  | "opening_checkout"
  | "verifying"
  | "success"
  | "failed"
  | "cancelled";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showBanner, setShowBanner } = useBanner();
  const { user, loading, refetch } = useUser();

  const planParam = searchParams.get("plan") || "";
  const billingParam = searchParams.get("billing") || "monthly";

  const planId = isPlanId(planParam) ? (planParam as PlanId) : null;
  const billing = isBillingCycle(billingParam)
    ? (billingParam as BillingCycle)
    : ("monthly" as BillingCycle);

  const [state, setState] = useState<CheckoutState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const plan = planId ? PLAN_CATALOG[planId] : null;
  const displayAmount = billing === "monthly" ? plan?.monthlyInr : plan?.yearlyInr;
  const displayCredits = billing === "monthly" ? plan?.monthlyCredits : (plan?.monthlyCredits || 0) * 12;

  const currentPaymentPath = useMemo(() => {
    const safePlan = planId || "starter";
    return `/payment?plan=${encodeURIComponent(safePlan)}&billing=${encodeURIComponent(billing)}`;
  }, [billing, planId]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(currentPaymentPath)}`);
    }
  }, [currentPaymentPath, loading, router, user]);

  useEffect(() => {
    if (planId) return;
    router.replace("/pricing");
  }, [planId, router]);

  function switchBilling(nextBilling: BillingCycle) {
    if (!planId) return;
    router.replace(`/payment?plan=${encodeURIComponent(planId)}&billing=${encodeURIComponent(nextBilling)}`);
  }

  async function handleCheckout() {
    if (!planId || !plan || !user) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setState("creating_order");

    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, billing }),
      });

      const orderData = (await orderRes.json()) as
        | (PaymentOrderResponse & {
            error?: string;
            order_id?: string;
            amount?: number;
            key_id?: string;
          })
        | { error?: string };

      const orderId =
        "order_id" in orderData && orderData.order_id
          ? orderData.order_id
          : "orderId" in orderData
          ? orderData.orderId
          : "";
      const amountPaise =
        "amount" in orderData && typeof orderData.amount === "number"
          ? orderData.amount
          : "amountPaise" in orderData && typeof orderData.amountPaise === "number"
          ? orderData.amountPaise
          : 0;
      const currency =
        "currency" in orderData && typeof orderData.currency === "string"
          ? orderData.currency
          : "INR";
      const keyId =
        "key_id" in orderData && orderData.key_id
          ? orderData.key_id
          : "keyId" in orderData
          ? orderData.keyId
          : "";

      if (!orderRes.ok || !orderId || !amountPaise || !keyId) {
        if (orderRes.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(currentPaymentPath)}`);
          return;
        }
        throw new Error(orderData.error || "Unable to create order");
      }

      if (!window.Razorpay) {
        throw new Error("Payment gateway not loaded. Please refresh and try again.");
      }

      setState("opening_checkout");

      const options = {
        key: keyId,
        amount: amountPaise,
        currency,
        name: "Waysorted",
        description: `${plan.name} (${billing})`,
        order_id: orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#0D7FF2",
        },
        modal: {
          ondismiss: () => {
            setState("cancelled");
            setErrorMessage("Payment was cancelled. You can retry any time.");
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setState("verifying");
            setErrorMessage(null);

            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = (await verifyRes.json()) as
              | PaymentVerifyResponse
              | { error?: string };

            if (!verifyRes.ok || !("ok" in verifyData)) {
              throw new Error(
                "error" in verifyData && verifyData.error
                  ? verifyData.error
                  : "Payment verification failed"
              );
            }

            setCreditsRemaining(verifyData.creditsRemaining);
            setSuccessMessage(
              `Payment successful. Added ${verifyData.creditsAdded} credits to your account.`
            );
            setState("success");
            await refetch();
          } catch (verifyError) {
            console.error("Payment verify error", verifyError);
            setState("failed");
            setErrorMessage(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed. Please contact support."
            );
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (failureResponse: {
        error?: { code?: string; description?: string };
      }) => {
        setState("failed");
        const gatewayMessage =
          failureResponse?.error?.description ||
          failureResponse?.error?.code ||
          "Payment failed at gateway.";
        setErrorMessage(gatewayMessage);
      });
      razorpay.open();
    } catch (error) {
      console.error("Checkout error", error);
      setState("failed");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start payment. Please retry."
      );
    }
  }

  if (!plan || !planId) return null;

  return (
    <main
      className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`}
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <section className="w-full px-4 py-10 md:py-14">
        <div className="mx-auto w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-secondary-db-100">
              Complete Payment
            </h1>
            <p className="mt-3 text-base md:text-lg text-secondary-db-80 max-w-2xl mx-auto">
              Review your selected plan and continue securely with Razorpay checkout.
            </p>
          </div>

          <div className="rounded-2xl border border-primary-way-10 bg-primary-way-5 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary-db-60">Selected Plan</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-secondary-db-100 mt-1">
                  {plan.name}
                </h2>
              </div>

              <div className="rounded-lg border border-primary-way-20 bg-white p-1 inline-flex gap-1">
                <button
                  type="button"
                  onClick={() => switchBilling("monthly")}
                  className={`px-4 py-2 text-sm rounded-md ${
                    billing === "monthly"
                      ? "bg-primary-way-100 text-white"
                      : "text-secondary-db-80"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => switchBilling("yearly")}
                  className={`px-4 py-2 text-sm rounded-md ${
                    billing === "yearly"
                      ? "bg-primary-way-100 text-white"
                      : "text-secondary-db-80"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-primary-way-10 bg-white p-4">
                <p className="text-xs text-secondary-db-60 uppercase tracking-wide">Amount</p>
                <p className="text-2xl font-semibold text-secondary-db-100 mt-1">₹{displayAmount}</p>
              </div>
              <div className="rounded-xl border border-primary-way-10 bg-white p-4">
                <p className="text-xs text-secondary-db-60 uppercase tracking-wide">Credits</p>
                <p className="text-2xl font-semibold text-secondary-db-100 mt-1">{displayCredits}</p>
              </div>
              <div className="rounded-xl border border-primary-way-10 bg-white p-4">
                <p className="text-xs text-secondary-db-60 uppercase tracking-wide">Billing</p>
                <p className="text-2xl font-semibold text-secondary-db-100 mt-1 capitalize">{billing}</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded-lg border border-error-300 bg-error-100 text-error-500 px-4 py-3 text-sm">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-6 rounded-lg border border-success-300 bg-success-100 text-success-500 px-4 py-3 text-sm">
                {successMessage}
                {typeof creditsRemaining === "number" && (
                  <span className="block mt-1 text-secondary-db-100 font-medium">
                    Updated credits: {creditsRemaining}
                  </span>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || state === "creating_order" || state === "verifying"}
                className="inline-flex items-center justify-center rounded-lg bg-primary-way-100 text-white px-7 py-3 font-medium hover:opacity-95 disabled:opacity-60 transition-opacity"
              >
                {state === "creating_order" && "Creating order..."}
                {state === "opening_checkout" && "Opening checkout..."}
                {state === "verifying" && "Verifying payment..."}
                {(state === "idle" || state === "failed" || state === "cancelled") && "Pay Now"}
                {state === "success" && "Pay Again"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="inline-flex items-center justify-center rounded-lg border border-secondary-db-20 text-secondary-db-100 px-7 py-3 font-medium hover:bg-secondary-db-5 transition-colors"
              >
                Back to Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
