"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  subscription_id?: string;
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

type OrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  key: string;
};

type VerificationResponse = {
  verified: boolean;
  warning?: string;
  payment: {
    id: string;
    order_id: string;
    status?: string;
    method?: string;
    amount?: number;
    currency?: string;
    email?: string;
    contact?: string;
    captured?: boolean;
    created_at?: number;
  };
};

type PaymentState = "idle" | "creating" | "opening" | "verifying" | "success" | "error";

const DEFAULT_FORM = {
  amount: "100",
  name: "Waysorted Test",
  email: "",
  contact: "",
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
    return Promise.reject(new Error("Razorpay checkout can only open in the browser."));
  }

  if (getRazorpayConstructor()) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load Razorpay checkout.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function formatCurrency(amountInPaise?: number, currency = "INR") {
  if (!amountInPaise) return "NA";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

export default function PaymentClient() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [state, setState] = useState<PaymentState>("idle");
  const [message, setMessage] = useState("Direct URL only. This page is not linked anywhere on the site.");
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);

  const amountPreview = useMemo(() => {
    const parsed = Number(form.amount);
    return Number.isFinite(parsed) && parsed > 0 ? `INR ${parsed.toFixed(2)}` : "Enter a valid INR amount";
  }, [form.amount]);

  async function handlePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("creating");
    setMessage("Creating Razorpay order...");
    setResult(null);

    try {
      await loadRazorpayScript();

      const orderResponse = await fetch("/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const orderPayload = (await orderResponse.json()) as OrderResponse | { error?: string };
      if (!orderResponse.ok || !("id" in orderPayload)) {
        throw new Error(
          ("error" in orderPayload && orderPayload.error) || "Unable to create Razorpay order.",
        );
      }

      setLastOrder(orderPayload);
      setState("opening");
      setMessage("Opening Razorpay checkout...");

      const Razorpay = getRazorpayConstructor();
      if (!Razorpay) {
        throw new Error("Razorpay checkout did not initialize correctly.");
      }

      const razorpay = new Razorpay({
        key: orderPayload.key,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "Waysorted",
        description: "Manual payment integration test",
        image: "/images/logo.svg",
        order_id: orderPayload.id,
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.contact.trim(),
        },
        notes: {
          receipt: orderPayload.receipt,
          source: "manual-payment-test",
        },
        theme: {
          color: "#265BD1",
        },
        modal: {
          ondismiss: () => {
            setState("idle");
            setMessage("Checkout closed. You can retry the same flow again.");
          },
        },
        handler: async (response) => {
          setState("verifying");
          setMessage("Payment received. Verifying signature with Razorpay...");

          const verificationResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderPayload.id,
              ...response,
            }),
          });

          const verificationPayload = (await verificationResponse.json()) as
            | VerificationResponse
            | { error?: string };

          if (!verificationResponse.ok || !("verified" in verificationPayload)) {
            throw new Error(
              ("error" in verificationPayload && verificationPayload.error) ||
                "Payment succeeded but verification failed.",
            );
          }

          setResult(verificationPayload);
          setState("success");
          setMessage(
            verificationPayload.warning ||
              "Payment verified successfully. This was processed against Razorpay test mode keys.",
          );
        },
      });

      razorpay.open();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Payment flow failed.";
      setState("error");
      setMessage(nextMessage);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#E8EFFC_0%,#FFFFFF_45%,#F6F8FC_100%)] px-4 py-10 text-[#0D1218] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
        <section className="w-full rounded-[28px] border border-[#D9E1F2] bg-white/90 p-6 shadow-[0_20px_60px_rgba(38,91,209,0.08)] backdrop-blur sm:p-8 lg:w-[58%]">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-[#D9E1F2] bg-[#EFF4FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#265BD1]">
                Internal Payment Route
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Razorpay payment test</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#565A5E] sm:text-base">
                  This page is intentionally isolated for manual verification on production. It is not linked in the
                  public navigation and is blocked from search indexing.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D9E1F2] bg-[#F7F9FD] px-4 py-3 text-sm text-[#565A5E]">
              <div className="font-medium text-[#0D1218]">Current mode</div>
              <div>Razorpay test keys</div>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handlePay}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  min="1"
                  name="amount"
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="100"
                  type="number"
                  value={form.amount}
                />
                <p className="text-xs text-[#565A5E]">Preview: {amountPreview}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Waysorted Test"
                  value={form.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Optional"
                  type="email"
                  value={form.email}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact">Phone</Label>
                <Input
                  id="contact"
                  name="contact"
                  onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
                  placeholder="Optional"
                  value={form.contact}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] p-4 text-sm leading-6 text-[#565A5E]">
              <p className="font-medium text-[#0D1218]">Recommended test data</p>
              <p>Card: `4111 1111 1111 1111` · CVV: `123` · Expiry: `12/26`</p>
              <p>UPI success on current Razorpay docs: `success@razorpay`</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={state === "creating" || state === "opening" || state === "verifying"}
                size="lg"
                type="submit"
              >
                {state === "creating"
                  ? "Creating order..."
                  : state === "opening"
                    ? "Opening checkout..."
                    : state === "verifying"
                      ? "Verifying payment..."
                      : "Pay with Razorpay"}
              </Button>
              <span className="text-sm text-[#565A5E]">{message}</span>
            </div>
          </form>
        </section>

        <aside className="w-full rounded-[28px] border border-[#D9E1F2] bg-[#0D1218] p-6 text-white shadow-[0_20px_60px_rgba(13,18,24,0.18)] sm:p-8 lg:w-[42%]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8BA7E8]">Verification status</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {state === "success" ? "Payment verified" : "Awaiting test payment"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                After a successful checkout, the page verifies the Razorpay signature server-side before showing the
                final result here.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/50">Last order</p>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p>Order ID: {lastOrder?.id || "Not created yet"}</p>
                <p>Amount: {lastOrder ? formatCurrency(lastOrder.amount, lastOrder.currency) : "NA"}</p>
                <p>Receipt: {lastOrder?.receipt || "NA"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/50">Verified payment</p>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p>Payment ID: {result?.payment.id || "NA"}</p>
                <p>Status: {result?.payment.status || "NA"}</p>
                <p>Method: {result?.payment.method || "NA"}</p>
                <p>Amount: {formatCurrency(result?.payment.amount, result?.payment.currency)}</p>
                <p>Captured: {typeof result?.payment.captured === "boolean" ? String(result.payment.captured) : "NA"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#21448F] bg-[#122544] p-4 text-sm leading-6 text-[#DDE8FF]">
              <p className="font-medium text-white">Route behavior</p>
              <p>No homepage link, no sitemap entry, `robots.txt` blocked, page-level `noindex` enabled.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
