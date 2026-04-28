"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingCard from "./components/PricingCard";
import { useUser } from "@/hooks/useUser";

type CatalogProduct = {
  code: string;
  name: string;
  kind: "starter" | "topup" | "subscription";
  eligibility: "new_user" | "standard" | "subscriber" | "everyone";
  priceInr: number;
  amountPaise: number;
  creditsGranted: number;
  bonusCredits: number;
  billingCycle: "one_time" | "monthly" | "yearly";
  currency: string;
  displayAmount?: number;
  pricingCountryName?: string;
  pricingTier?: "tier_1" | "tier_2" | "tier_3";
  pricingRiskFlags?: string[];
};

export type PricingPayload = {
  pricingVersion: string;
  pricing: {
    country: string;
    countryName: string;
    tier: "tier_1" | "tier_2" | "tier_3";
    currency: string;
    riskFlags: string[];
    locked?: boolean;
    source?: string;
  };
  catalog: CatalogProduct[];
};

const monthlyCodes = ["sub_month_1", "sub_month_2", "sub_month_3"];
const yearlyCodes = ["sub_year_1599", "sub_year_3499", "sub_year_7499"];
const standardTopupCodes = ["topup_std_50", "topup_std_100", "topup_std_120"];
const subscriberTopupCodes = ["topup_sub_50", "topup_sub_100", "topup_sub_120"];

const planUi = [
  {
    planName: "Discover",
    description: "Best for new users getting started with the Waysorted ecosystem.",
    ctaLabel: "Build Plan",
    discountTag: "Start",
    iconSrc: "/pricingIcons/Discover.png",
    features: [
      "Backend-authoritative subscription status",
      "Full credit block granted after payment sync",
      "Customisable presets included while active",
      "Credits tracked through ledger entries",
    ],
  },
  {
    planName: "Core",
    description: "Perfect for agencies who need automation and scaling workflows.",
    ctaLabel: "Get Started",
    discountTag: "Popular",
    iconSrc: "/pricingIcons/Core.png",
    featured: true,
    features: [
      "Backend-authoritative subscription status",
      "Full credit block granted after payment sync",
      "Customisable presets included while active",
      "Credits tracked through ledger entries",
    ],
  },
  {
    planName: "Pro",
    description: "For high-growth teams and enterprises with advanced needs.",
    ctaLabel: "Build Plan",
    discountTag: "Scale",
    iconSrc: "/pricingIcons/Pro.png",
    features: [
      "Backend-authoritative subscription status",
      "Full credit block granted after payment sync",
      "Customisable presets included while active",
      "Credits tracked through ledger entries",
    ],
  },
];

const faqItems = [
  "What is Waysorted?",
  "How is Waysorted different from other plugin services?",
  "What tools are included?",
  "Who creates these tool packs?",
  "Can I suggest tools to be included?",
  "Will Waysorted slow down my Figma?",
  "Is Waysorted safe and secure?",
  "What if I face an issue while using Waysorted?",
  "How do I get started?",
];

function minorUnitMultiplier(currency: string) {
  const digits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return 10 ** digits;
}

function formatCurrency(amountSubunits: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amountSubunits / minorUnitMultiplier(currency));
}

function sortByCodes(products: CatalogProduct[], codes: string[]) {
  return codes
    .map((code) => products.find((product) => product.code === code))
    .filter((product): product is CatalogProduct => Boolean(product));
}

export default function PricingClient({
  initialPricingData,
  initialPricingError,
}: {
  initialPricingData: PricingPayload | null;
  initialPricingError: string | null;
}) {
  const router = useRouter();
  const { user, loading } = useUser();
  const { showBanner, setShowBanner } = useBanner();
  const [activeFaq, setActiveFaq] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paygMode, setPaygMode] = useState<"standard" | "subscriber">("standard");
  const [selectedTopupIndex, setSelectedTopupIndex] = useState(1);
  const [pricingData, setPricingData] = useState<PricingPayload | null>(initialPricingData);
  const [pricingError, setPricingError] = useState<string | null>(initialPricingError);
  const skippedInitialRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadPricing() {
      setPricingError(null);
      try {
        let response = await fetch("/api/billing/catalog", {
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401) {
          response = await fetch("/api/billing/public-catalog", { cache: "no-store" });
        }

        const payload = (await response.json()) as PricingPayload | { error?: string };
        if (!response.ok || !("catalog" in payload)) {
          throw new Error(("error" in payload && payload.error) || "Unable to load pricing.");
        }

        if (active) setPricingData(payload);
      } catch (error) {
        if (active) {
          setPricingError(error instanceof Error ? error.message : "Unable to load pricing.");
        }
      }
    }

    if (loading) {
      return () => {
        active = false;
      };
    }

    if (!skippedInitialRef.current && initialPricingData) {
      skippedInitialRef.current = true;
      return () => {
        active = false;
      };
    }

    loadPricing();
    return () => {
      active = false;
    };
  }, [initialPricingData, loading, user?._id]);

  const subscriptionProducts = useMemo(() => {
    if (!pricingData) return [];
    return sortByCodes(pricingData.catalog, billingCycle === "monthly" ? monthlyCodes : yearlyCodes);
  }, [billingCycle, pricingData]);

  const topupProducts = useMemo(() => {
    if (!pricingData) return [];
    return sortByCodes(pricingData.catalog, paygMode === "subscriber" ? subscriberTopupCodes : standardTopupCodes);
  }, [paygMode, pricingData]);

  const topupMarks = useMemo(
    () => [
      {
        title: "Free",
        value: "300 credits",
        amountLabel: "Free",
        product: null as CatalogProduct | null,
      },
      ...topupProducts.map((product) => ({
        title: formatCurrency(product.amountPaise, product.currency),
        value: `${product.creditsGranted + product.bonusCredits} credits`,
        amountLabel: formatCurrency(product.amountPaise, product.currency),
        product,
      })),
    ],
    [topupProducts],
  );

  const activeTopup = topupMarks[Math.min(selectedTopupIndex, topupMarks.length - 1)] || topupMarks[0];

  function goToCheckout(productCode: string | null) {
    if (!productCode) return;

    const target = `/billing?product=${encodeURIComponent(productCode)}`;
    if (!user && !loading) {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    router.push(target);
  }

  return (
    <main className={`min-h-screen bg-[#F5F7FC] ${showBanner ? "pt-24" : "pt-16"}`}>
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <section className="w-full px-4 pb-16 pt-10 md:pb-20 md:pt-14">
        <div className="mx-auto w-full max-w-[1040px]">
          <div className="mb-8 text-center">
            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-[-0.02em] text-secondary-db-100">
              Choose the perfect plan for your workflow
            </h1>

            <div className="mx-auto mt-5 inline-flex items-center rounded-full border border-[#E3E9F5] bg-white p-1 text-xs font-medium text-[#5E6A7B]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-1.5 transition-colors duration-200 ${
                  billingCycle === "monthly" ? "bg-[#EEF3FF] text-[#2F67FF] shadow-sm" : ""
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-full px-5 py-1.5 transition-colors duration-200 ${
                  billingCycle === "yearly" ? "bg-[#EEF3FF] text-[#2F67FF] shadow-sm" : ""
                }`}
              >
                Yearly
              </button>
            </div>

            {pricingError ? <div className="mt-4 text-[12px] text-[#B42318]">{pricingError}</div> : null}
          </div>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {subscriptionProducts.map((product, index) => {
              const ui = planUi[index] || planUi[0];
              return (
                <PricingCard
                  key={product.code}
                  planName={ui.planName}
                  description={ui.description}
                  amountLabel={formatCurrency(product.amountPaise, product.currency)}
                  cycleLabel={billingCycle}
                  creditsLabel={`${(product.creditsGranted + product.bonusCredits).toLocaleString()} credits/${billingCycle}`}
                  ctaLabel={ui.ctaLabel}
                  discountTag={ui.discountTag}
                  iconSrc={ui.iconSrc}
                  featured={ui.featured}
                  features={ui.features}
                  onSelect={() => goToCheckout(product.code)}
                />
              );
            })}
          </section>

          <section className="mt-5 rounded-2xl border border-[#E7EDF7] bg-white p-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_1fr]">
              <div>
                <p className="flex items-center gap-2 text-[42px] font-semibold leading-none tracking-[-0.02em] text-secondary-db-100">
                  <Image src="/pricingIcons/Pay as you go.png" alt="" width={20} height={20} className="h-5 w-5" />
                  <span>Pay as you go</span>
                </p>
                <p className="mt-3 max-w-[430px] text-[13px] leading-[1.45] text-[#687184]">
                  Top up credits when needed. The website backend chooses the eligible top-up product and Razorpay
                  amount; the browser never sends a trusted balance or price.
                </p>
                <ul className="mt-6 space-y-3 text-[13px] text-[#2F3749]">
                  <li className="flex items-start gap-2">
                    <Image src="/icons/check.svg" alt="" width={16} height={16} className="mt-[3px] h-4 w-4" />
                    <span>New users receive a one-time 300-credit starter grant after auth checks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Image src="/icons/check.svg" alt="" width={16} height={16} className="mt-[3px] h-4 w-4" />
                    <span>Duplicate payments and retries are guarded by idempotency and webhooks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Image src="/icons/check.svg" alt="" width={16} height={16} className="mt-[3px] h-4 w-4" />
                    <span>Subscribed users see subscriber top-up economics at checkout.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-start gap-2.5 text-[12px] text-[#111827]">
                  <button
                    type="button"
                    onClick={() => {
                      setPaygMode("standard");
                      setSelectedTopupIndex(1);
                    }}
                    className={`font-medium transition-colors duration-200 ${
                      paygMode === "standard" ? "text-[#111827]" : "text-[#6B7280]"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaygMode(paygMode === "standard" ? "subscriber" : "standard");
                      setSelectedTopupIndex(1);
                    }}
                    className="relative h-6 w-11 rounded-full bg-[#111827] transition-transform duration-200 active:scale-95"
                    aria-label="Toggle subscriber top-up mode"
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        paygMode === "subscriber" ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaygMode("subscriber");
                      setSelectedTopupIndex(1);
                    }}
                    className={`font-medium transition-colors duration-200 ${
                      paygMode === "subscriber" ? "text-[#111827]" : "text-[#6B7280]"
                    }`}
                  >
                    Subscriber
                  </button>
                  <span className="rounded-full bg-[#16A34A] px-3 py-1 text-[11px] font-semibold text-white">
                    Dynamic
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <p className="text-[48px] font-semibold leading-none text-[#111827]">
                    {activeTopup?.amountLabel || "--"}
                  </p>
                  <p className="pb-1 text-[13px] text-[#111827]">for {activeTopup?.value || "--"}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {topupMarks.map((mark, index) => (
                    <button
                      key={`${mark.title}-${mark.value}`}
                      type="button"
                      onClick={() => setSelectedTopupIndex(index)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors duration-150 ${
                        index === selectedTopupIndex
                          ? "border-[#3C6FE8] bg-[#EEF3FF]"
                          : "border-[#E7EDF7] bg-[#F7F9FD]"
                      }`}
                    >
                      <p className="text-[13px] font-semibold text-[#111827]">{mark.title}</p>
                      <p className="mt-1 text-[12px] text-[#6B7280]">{mark.value}</p>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToCheckout(activeTopup?.product?.code || null)}
                  disabled={!activeTopup?.product}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-secondary-db-20 bg-secondary-db-100 px-5 py-[11px] text-[12px] font-semibold text-white transition-opacity duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{activeTopup?.product ? "Purchase credits" : "Starter grant is automatic"}</span>
                </button>
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-center text-[34px] font-semibold text-secondary-db-100">
              <span className="rounded-md bg-[#EAF1FF] px-2 py-0.5">Top</span> Frequently Asked Questions
            </h2>
            <p className="mt-2 text-center text-[12px] text-[#7A8499]">
              Quick answers about Waysorted plans, credits, safety, and billing.
            </p>

            <div className="mx-auto mt-6 max-w-[930px] rounded-2xl border border-[#E7EDF7] bg-white p-3 md:p-4">
              {faqItems.map((item, idx) => (
                <button
                  key={item}
                  onClick={() => setActiveFaq(idx)}
                  className="mb-2 w-full rounded-xl border border-[#EEF2FA] bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-[#F8FAFF] last:mb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-secondary-db-100">{item}</span>
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#667085] transition-transform duration-200 ${
                        activeFaq === idx ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                        <path
                          d="M5.5 7.5L10 12.5L14.5 7.5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  {activeFaq === idx && (
                    <p className="mt-2 pr-8 text-[11px] leading-relaxed text-[#667085]">
                      Waysorted combines design workflow tools with a backend-led credit system. Payments, subscription
                      status, reservations, and refunds are reconciled on the server, not by frontend state.
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
