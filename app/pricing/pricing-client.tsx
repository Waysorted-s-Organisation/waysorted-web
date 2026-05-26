"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronRight, Gift } from "lucide-react";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlowStarButton from "@/components/GlowStarButton";
import PricingCard from "./components/PricingCard";
import BillingDetailsModal, { type BillingDetails } from "@/components/BillingDetailsModal";
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
    description: "Best for individuals getting started with Waysorted.",
    ctaLabel: "Select Plan",
    discountTag: "20% OFF",
    originalAmountLabel: "₹199",
    monthlyCreditsLabel: "250 credits/month",
    bonusCreditsLabel: "Plus 25 bonus credits for new users",
    iconSrc: "/pricingIcons/Discover.png",
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expires, no monthly resets.",
    ],
  },
  {
    planName: "Core",
    description: "Perfect for designers who need full access to tools, credits & ongoing updates.",
    ctaLabel: "Get Started",
    discountTag: "10% OFF",
    originalAmountLabel: "₹399",
    monthlyCreditsLabel: "500 credits/month",
    bonusCreditsLabel: "Plus 50 bonus credits for new users",
    iconSrc: "/pricingIcons/Core.png",
    featured: true,
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for small topups",
      "Credits never expires, no monthly resets.",
    ],
  },
  {
    planName: "Pro",
    description: "Designed for studios and enterprises with more support & credits.",
    ctaLabel: "Select Plan",
    discountTag: "5% OFF",
    originalAmountLabel: "₹799",
    monthlyCreditsLabel: "1200 credits/month",
    bonusCreditsLabel: "Plus 100 bonus credits for new users",
    iconSrc: "/pricingIcons/Pro.png",
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expires, no monthly resets.",
    ],
  },
];

const faqs = [
  {
    question: "What are Waysorted credits?",
    answer:
      "Credits are used for extra or heavier actions inside Waysorted, such as advanced exports, high-compute tools, or future AI-powered actions. In simple terms, credits let you use more without paying for a bigger plan.",
  },
  {
    question: "Do I need a subscription to use Waysorted?",
    answer:
      "No. You can start with credits only and top up when needed. Subscriptions are better if you want monthly credits and lower top-up costs.",
  },
  {
    question: "What is the difference between a plan and credit top-up?",
    answer:
      "A plan gives you recurring credits each billing cycle. A credit top-up is a one-time purchase you can use whenever your workflow needs more.",
  },
  {
    question: "Do credits expire?",
    answer: "No. Credits stay on your account until you use them.",
  },
  {
    question: "Can I buy credits without upgrading to a paid plan?",
    answer: "Yes. Credit purchases work separately, so you can buy them without a subscription.",
  },
  {
    question: "Which plan should I choose?",
    answer: "Discover is best for getting started, Core fits regular usage, and Pro works best for larger teams or heavier workflows.",
  },
  {
    question: "What happens when my subscription ends?",
    answer: "Your paid plan stops renewing, but any unused credits already in your account remain available.",
  },
  {
    question: "Can I upgrade later?",
    answer: "Yes. You can switch plans later if your needs grow.",
  },
  {
    question: "Where can I manage my plan and credits?",
    answer: "You can manage billing, subscriptions, and credit purchases from your billing area after sign-in.",
  },
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paygMode, setPaygMode] = useState<"standard" | "subscriber">("standard");
  const [selectedTopupIndex, setSelectedTopupIndex] = useState(1);
  const [pricingData, setPricingData] = useState<PricingPayload | null>(initialPricingData);
  const [pricingError, setPricingError] = useState<string | null>(initialPricingError);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const requireBillingDetails = (action: () => void) => {
    if (!user) {
      action();
      return;
    }
    setPendingAction(() => action);
    setIsBillingModalOpen(true);
  };

  const handleBillingSubmit = async (details: BillingDetails) => {
    const res = await fetch("/api/billing/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save billing details");
    }

    setIsBillingModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadPricing() {
      setPricingError(null);
      try {
        const response = await fetch(`/api/billing/public-catalog?ts=${Date.now()}`, { cache: "no-store" });
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

    loadPricing();
    return () => {
      active = false;
    };
  }, [user?._id]);

  const subscriptionProducts = useMemo(() => {
    if (!pricingData) return [];
    return sortByCodes(pricingData.catalog, billingCycle === "monthly" ? monthlyCodes : yearlyCodes);
  }, [billingCycle, pricingData]);

  const topupProducts = useMemo(() => {
    if (!pricingData) return [];
    return sortByCodes(pricingData.catalog, paygMode === "subscriber" ? subscriberTopupCodes : standardTopupCodes);
  }, [paygMode, pricingData]);

  const availablePaygModes = useMemo(() => {
    const catalog = pricingData?.catalog || [];
    return {
      standard: standardTopupCodes.some((code) => catalog.some((product) => product.code === code)),
      subscriber: subscriberTopupCodes.some((code) => catalog.some((product) => product.code === code)),
    };
  }, [pricingData]);

  const topupMarks = useMemo(
    () => [
      {
        title: "Free",
        creditsLabel: "15 credits",
        value: "15",
        product: null as CatalogProduct | null,
      },
      ...topupProducts.map((product) => ({
        title: formatCurrency(product.amountPaise, product.currency),
        creditsLabel: `${product.creditsGranted + product.bonusCredits} credits`,
        value: `${product.creditsGranted + product.bonusCredits}`,
        product,
      })),
    ],
    [topupProducts],
  );

  const clampedTopupIndex = Math.min(selectedTopupIndex, Math.max(topupMarks.length - 1, 0));
  const activeTopup = topupMarks[clampedTopupIndex] || topupMarks[0];
  const sliderPercent = topupMarks.length > 1 ? (clampedTopupIndex / (topupMarks.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!pricingData) return;

    if (paygMode === "standard" && !availablePaygModes.standard && availablePaygModes.subscriber) {
      setPaygMode("subscriber");
      setSelectedTopupIndex(1);
      return;
    }

    if (paygMode === "subscriber" && !availablePaygModes.subscriber && availablePaygModes.standard) {
      setPaygMode("standard");
      setSelectedTopupIndex(1);
    }
  }, [availablePaygModes.standard, availablePaygModes.subscriber, paygMode, pricingData]);

  function goToCheckout(productCode: string | null) {
    if (!productCode) return;

    const target = `/billing?product=${encodeURIComponent(productCode)}&autostart=1`;
    if (!user && !loading) {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    requireBillingDetails(() => router.push(target));
  }

  return (
    <main className={`min-h-screen bg-[#F6F7FB] ${showBanner ? "pt-24" : "pt-16"}`}>
      <BillingDetailsModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        onSubmit={handleBillingSubmit}
        initialData={user?.billing?.billingDetails}
      />

      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <section className="px-4 pb-16 pt-6 md:pb-24 md:pt-8">
        <div className="mx-auto w-full max-w-[1120px]">
          <div className="mb-10 flex items-center gap-2 text-[12px] text-[#8A94A6]">
            <Link href="/" className="underline text-[#8A94A6] hover:text-[#111827] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8A94A6]" />
            <span className="font-medium text-[#111827] underline">Pricing</span>
          </div>

          <div className="text-center">
            <h1 className="text-[32px] font-semibold leading-[1.15] text-[#111827] md:text-[46px]">
              Perfect plans for your workflow
            </h1>

            <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-[#111827]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={billingCycle === "monthly" ? "font-semibold" : "text-[#6B7280]"}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative h-[20px] w-[38px] rounded-full bg-[#111827]"
                aria-label="Toggle billing cycle"
              >
                <span
                  className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-all ${
                    billingCycle === "yearly" ? "left-[20px]" : "left-[2px]"
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={billingCycle === "yearly" ? "font-semibold" : "text-[#6B7280]"}
              >
                Yearly
              </button>
              <span className="rounded-[999px] bg-[#2F63D7] px-2 py-[3px] text-[10px] font-semibold text-white">
                Save 17%
              </span>
            </div>

            <p className="mt-8 text-[14px] text-[#8A94A6]">
              30-day money-back guarantee on all paid plans - no question asked.
            </p>

            {pricingError ? <div className="mt-3 text-[12px] text-[#B42318]">{pricingError}</div> : null}
          </div>

          <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {subscriptionProducts.map((product, index) => {
              const ui = planUi[index] || planUi[0];
              return (
                <PricingCard
                  key={product.code}
                  planName={ui.planName}
                  description={ui.description}
                  originalAmountLabel={billingCycle === "monthly" ? ui.originalAmountLabel : undefined}
                  amountLabel={formatCurrency(product.amountPaise, product.currency)}
                  cycleLabel="monthly"
                  creditsLabel={
                    billingCycle === "monthly"
                      ? ui.monthlyCreditsLabel
                      : `${(product.creditsGranted + product.bonusCredits).toLocaleString()} credits/year`
                  }
                  ctaLabel={ui.ctaLabel}
                  discountTag={ui.discountTag}
                  iconSrc={ui.iconSrc}
                  featured={ui.featured}
                  features={ui.features}
                  onSelect={() => goToCheckout(product.code)}
                  bonusCreditsLabel={ui.bonusCreditsLabel}
                />
              );
            })}
          </section>

          <div className="mx-auto mt-8 max-w-[790px] rounded-[15.31px] border border-[#ECEFF5] bg-white p-6 md:p-3">
            <div className="flex flex-col items-center text-center md:flex-row md:text-left gap-4">
              <Image
                src="/pricingIcons/Credit topup message icon.png"
                alt="Not ready for a plan?"
                width={48}
                height={48}
                className="h-[48px] w-[48px] shrink-0 object-contain"
              />
              {/* Mobile text layout */}
              <div className="md:hidden">
                <p className="text-[18px] font-semibold text-[#111827]">Not ready for a plan?</p>
                <p className="mt-2 text-[15px] leading-[1.5] text-[#7C8798]">
                  Start with <span className="font-semibold text-[#111827]">Credits top up</span> and use Waysorted<br />
                  only when your workflow needs it.<br />
                  No subscription or monthly reset required.
                </p>
              </div>
              {/* Desktop text layout */}
              <p className="hidden md:block text-[14px] leading-[1.5] text-[#7C8798]">
                <span className="text-[15px] font-semibold text-[#111827]">Not ready for a plan?</span> Start with <span className="font-semibold text-[#111827]">Credits top-up</span> and use Waysorted only when your workflow needs it. No subscription or monthly reset required.
              </p>
            </div>
          </div>

          <section className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <Image src="/pricingIcons/Pay as you go.png" alt="" width={20} height={20} className="h-5 w-5" />
                <h2 className="text-[26px] font-semibold text-[#111827] md:text-[42px]">Pay as you go</h2>
              </div>

              <p className="mt-4 max-w-[320px] text-[14px] leading-[1.5] text-[#7C8798]">
                Top up credits whenever you need extra power for advanced actions. No monthly reset, no wasted balance,
                your credits stay until you use them.
              </p>

              <ul className="hidden md:block mt-6 space-y-4">
                {[
                  "Includes all core Waysorted features",
                  "Regular updates with ongoing support",
                  "Credits never expires, reset when needed",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[14px] text-[#3D4656]">
                    <Image src="/icons/purple.svg" alt="" width={16} height={16} className="mt-0.5 h-4 w-4" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="rounded-[15.31px] border border-[#E8ECF4] bg-white p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3 text-[12px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPaygMode("standard");
                      setSelectedTopupIndex(1);
                    }}
                    disabled={!availablePaygModes.standard}
                    className={paygMode === "standard" ? "font-semibold text-[#111827]" : "text-[#6B7280]"}
                  >
                    First Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = paygMode === "standard" ? "subscriber" : "standard";
                      if (nextMode === "subscriber" && !availablePaygModes.subscriber) return;
                      if (nextMode === "standard" && !availablePaygModes.standard) return;
                      setPaygMode(nextMode);
                      setSelectedTopupIndex(1);
                    }}
                    className="relative h-[20px] w-[38px] rounded-full bg-[#111827]"
                    aria-label="Toggle pay as you go mode"
                  >
                    <span
                      className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-all ${
                        paygMode === "subscriber" ? "left-[20px]" : "left-[2px]"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaygMode("subscriber");
                      setSelectedTopupIndex(1);
                    }}
                    disabled={!availablePaygModes.subscriber}
                    className={paygMode === "subscriber" ? "font-semibold text-[#111827]" : "text-[#6B7280]"}
                  >
                    Subscribed User
                  </button>
                  <span className="rounded-[999px] bg-[#1DB96B] px-2 py-[3px] text-[10px] font-semibold text-white">
                    Extra Credits
                  </span>
                </div>

                {/* Credit heading - same on desktop and mobile, responsive font size */}
                <div className="mt-6">
                  <p className="text-[30px] font-bold leading-none text-[#111827] md:text-[36px] tracking-tight">
                    {activeTopup?.value || "--"} Credits
                  </p>
                </div>

                {/* Unified responsive slider */}
                <div className="mt-8 md:mt-10">
                  <div className="relative h-[18px] w-full">
                    <div className="absolute left-0 right-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[#D9DDE7]" />
                    <div
                      className="absolute left-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full"
                      style={{
                        width: `${sliderPercent}%`,
                        background: "linear-gradient(90deg, #8B5CF6 0%, #6D30F5 100%)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 h-[30px] w-[30px] -translate-y-1/2 rounded-full"
                      style={{
                        left: `calc(${sliderPercent}% - 15px)`,
                        background: "linear-gradient(135deg, #8B46FF 0%, #6E2FF4 100%)",
                        boxShadow: "0 0 10px 3px rgba(139, 92, 246, 0.4)",
                      }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(topupMarks.length - 1, 0)}
                    step={1}
                    value={clampedTopupIndex}
                    onChange={(event) => setSelectedTopupIndex(Number(event.target.value))}
                    className="relative z-10 -mt-[18px] h-[30px] w-full cursor-pointer opacity-0"
                  />

                  {/* Responsive marks */}
                  <div className="relative mt-6 h-[64px] md:h-[74px]">
                    {topupMarks.map((mark, index) => {
                      const position = topupMarks.length > 1 ? (index / (topupMarks.length - 1)) * 100 : 0;
                      const alignmentClass =
                        index === 0
                          ? "left-0 text-left"
                          : index === topupMarks.length - 1
                            ? "left-full -translate-x-full text-right"
                            : "text-center";

                      return (
                        <button
                          key={`${mark.title}-${mark.value}`}
                          type="button"
                          onClick={() => setSelectedTopupIndex(index)}
                          className={`absolute top-0 ${alignmentClass}`}
                          style={index === 0 || index === topupMarks.length - 1 ? undefined : { left: `${position}%`, transform: "translateX(-50%)" }}
                        >
                          <p className={`text-[12px] md:text-[15px] font-semibold ${index === clampedTopupIndex ? "text-[#111827]" : "text-[#4B5563]"}`}>
                            {mark.title}
                          </p>
                          <p className="mt-0.5 whitespace-nowrap text-[10px] md:text-[12px] text-[#8A94A6]">{mark.creditsLabel}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <GlowStarButton
                  type="button"
                  onClick={() => goToCheckout(activeTopup?.product?.code || null)}
                  disabled={!activeTopup?.product}
                  className="mt-8 h-[42px] w-full rounded-[10px] bg-[#111827] text-[13px] font-medium text-white disabled:opacity-60 cursor-pointer"
                  starCount={18}
                  enterDurationSec={0.35}
                >
                  {activeTopup?.product ? "Purchase credits" : "Starter grant is automatic"}
                </GlowStarButton>
              </div>

              {/* Mobile-only checklist displayed below the Pay as you go card */}
              <ul className="md:hidden mt-6 space-y-4 px-2">
                {[
                  "Includes all core Waysorted features",
                  "Regular updates with ongoing support",
                  "Credits never expires, reset when needed",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[14px] text-[#3D4656]">
                    <Image src="/icons/purple.svg" alt="" width={16} height={16} className="mt-0.5 h-4 w-4" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mx-auto mt-24 max-w-[880px]">
            <div className="text-center">
              <h2 className="text-[32px] font-semibold text-[#111827] md:text-[44px]">Common Questions</h2>
              <p className="mt-3 text-[16px] text-[#8A94A6]">Everything you need to know before buying.</p>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.question}
                    className={`group overflow-hidden rounded-[12px] border transition-all ${
                      isOpen ? "border-[#E9EDF5] bg-white" : "border-transparent bg-white hover:border-[#EAF1FF]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer transition-colors ${
                        isOpen ? "bg-white hover:bg-[#F8FAFC]" : "bg-white hover:bg-[#EAF1FF]"
                      } ${isOpen ? "" : "rounded-[12px]"}`}
                    >
                      <span className="text-[15px] font-medium text-[#111827]">{faq.question}</span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                        isOpen 
                          ? "bg-[#EAF1FF] text-[#2F63D7]" 
                          : "bg-transparent text-[#98A2B3] group-hover:bg-[#EAF1FF] group-hover:text-[#2F63D7]"
                      }`}>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        )}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="px-5 pb-5 text-[14px] leading-[1.55] text-[#667085] bg-white">{faq.answer}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mx-auto mt-24 max-w-[880px] text-center">
            <h2 className="text-[30px] font-semibold leading-[1.2] text-[#111827] md:text-[44px]">
              Ready to experience the flow?
            </h2>
            <p className="mt-3 text-[16px] text-[#8A94A6]">
              Replace multiple plugin subscriptions with one complete Waysorted suite.
            </p>
            <button
              type="button"
              onClick={() => {
                const corePlan = subscriptionProducts[1] || subscriptionProducts[0];
                goToCheckout(corePlan?.code || null);
              }}
              className="relative mt-8 h-[72px] w-full rounded-[20px] bg-[#111827] px-6 text-[24px] font-medium text-white md:text-[28px] overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Bottom white gradient inside the button */}
              <div className="absolute inset-x-0 bottom-0 h-[24px] bg-gradient-to-t from-white/20 to-transparent pointer-events-none group-hover:from-white/30 transition-all" />
              <span className="relative z-10">Get core — ₹349/monthly</span>
            </button>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
