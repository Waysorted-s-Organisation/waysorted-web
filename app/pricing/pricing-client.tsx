"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingCard from "./components/PricingCard";
import GlowStarButton from "@/components/GlowStarButton";
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
    discountTag: "25% OFF",
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
    discountTag: "13% OFF",
    originalAmountLabel: "₹399",
    monthlyCreditsLabel: "500 credits/month",
    bonusCreditsLabel: "Plus 50 bonus credits for new users",
    iconSrc: "/pricingIcons/Core.png",
    featured: true,
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expires, no monthly resets.",
    ],
  },
  {
    planName: "Pro",
    description: "Designed for studios and enterprises with more support & credits.",
    ctaLabel: "Select Plan",
    discountTag: "6% OFF",
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

  const requireBillingDetails = (action: () => void) => {
    if (!user) {
      action(); // let login redirect handle it
      return;
    }
    // Always show the modal, but it will be pre-filled with existing details
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
    
    // Proceed with the action that was blocked
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
        value: "300",
        amountLabel: "Free",
        product: null as CatalogProduct | null,
      },
      ...topupProducts.map((product) => ({
        title: formatCurrency(product.amountPaise, product.currency),
        value: `${product.creditsGranted + product.bonusCredits}`,
        amountLabel: formatCurrency(product.amountPaise, product.currency),
        product,
      })),
    ],
    [topupProducts],
  );

  const activeTopup = topupMarks[Math.min(selectedTopupIndex, topupMarks.length - 1)] || topupMarks[0];

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
    <main className={`min-h-screen bg-white ${showBanner ? "pt-24" : "pt-16"}`}>
      <BillingDetailsModal 
        isOpen={isBillingModalOpen} 
        onClose={() => setIsBillingModalOpen(false)} 
        onSubmit={handleBillingSubmit}
        initialData={user?.billing?.billingDetails}
      />
      
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <section className="w-full px-4 pb-16 pt-10 md:pb-20 md:pt-14">
        <div className="mx-auto w-full max-w-[1110px]">
          <div className="mb-8 text-center">
            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-[-0.02em] text-secondary-db-100">
              Perfect plans for your workflow
            </h1>

            <div className="mx-auto mt-6 flex items-center justify-center gap-3 text-[16px]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`font-medium transition-colors duration-200 ${
                  billingCycle === "monthly" ? "text-secondary-db-100" : "text-[#6B7280]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative h-6 w-11 rounded-full bg-[#111827] transition-transform duration-200 hover:scale-105 active:scale-95"
                aria-label="Toggle billing cycle"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                    billingCycle === "yearly" ? "left-6" : "left-1"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`font-medium transition-colors duration-200 ${
                    billingCycle === "yearly" ? "text-secondary-db-100" : "text-[#6B7280]"
                  }`}
                >
                  Yearly
                </button>
                <span className="rounded-md bg-primary-way-100 px-1.5 py-0.5 text-[14px] font-regular tracking-wide text-white">
                  Save 20%
                </span>
              </div>
            </div>

            {pricingError ? <div className="mt-4 text-[12px] text-[#B42318]">{pricingError}</div> : null}


          </div>

          <section className="grid min-h-[478px] grid-cols-1 gap-4 md:grid-cols-3">
            {subscriptionProducts.map((product, index) => {
              const ui = planUi[index] || planUi[0];
              return (
                <PricingCard
                  key={product.code}
                  planName={ui.planName}
                  description={ui.description}
                  originalAmountLabel={billingCycle === "monthly" ? ui.originalAmountLabel : undefined}
                  amountLabel={formatCurrency(product.amountPaise, product.currency)}
                  cycleLabel={billingCycle}
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

          <section className="mt-5 rounded-2xl border-5 border-secondary-db-5 p-6 transition-all duration-300 hover:shadow-[0_12px_28px_rgba(25,40,86,0.08)] ">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_1fr]">
              <div>
                <p className="flex items-center gap-2 text-[42px] font-semibold leading-none tracking-[-0.02em] text-secondary-db-100">
                  <Image src="/pricingIcons/Pay as you go.png" alt="" width={20} height={20} className="h-5 w-5" />
                  <span>Pay as you go</span>
                </p>
                <p className="mt-3 max-w-[430px] text-[13px] leading-[1.45] text-[#687184]">
                  Spend less to grow more with Pay as you go top up credit model, pay only when you need to, credits
                  never expire, reset when credits get low!
                </p>
                <ul className="mt-6 space-y-3 text-[13px] text-[#2F3749]">
                  <li className="flex items-start gap-2">
                    <Image src="/icons/check.svg" alt="" width={16} height={16} className="mt-[3px] h-4 w-4" />
                    <span>Includes all core Waysorted features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Image src="/icons/check.svg" alt="" width={16} height={16} className="mt-[3px] h-4 w-4" />
                    <span>Regular updates with ongoing support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Image src="/icons/check.svg" alt="" width={16} height={16} className="mt-[3px] h-4 w-4" />
                    <span>Credits never expires, reset when needed</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-start gap-2.5 text-[16px] text-[#111827]">
                  <button
                    type="button"
                    onClick={() => {
                      setPaygMode("standard");
                      setSelectedTopupIndex(1);
                    }}
                    disabled={!availablePaygModes.standard}
                    className={`font-medium transition-colors duration-200 hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-45 ${
                      paygMode === "standard" ? "text-[#111827]" : "text-[#6B7280]"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!availablePaygModes.standard && availablePaygModes.subscriber) {
                        setPaygMode("subscriber");
                        setSelectedTopupIndex(1);
                        return;
                      }
                      if (!availablePaygModes.subscriber && availablePaygModes.standard) {
                        setPaygMode("standard");
                        setSelectedTopupIndex(1);
                        return;
                      }
                      setPaygMode(paygMode === "standard" ? "subscriber" : "standard");
                      setSelectedTopupIndex(1);
                    }}
                    className="relative h-6 w-11 rounded-full bg-[#111827] transition-transform duration-200 hover:scale-105 active:scale-95"
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
                    disabled={!availablePaygModes.subscriber}
                    className={`font-medium transition-colors duration-200 hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-45 ${
                      paygMode === "subscriber" ? "text-[#111827]" : "text-[#6B7280]"
                    }`}
                  >
                    Subscriber
                  </button>
                  <span className="rounded-md bg-[#01A04E] px-1.5 py-0.5 text-[14px] font-regular tracking-wide text-white ">
                    Extra credit
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <p className="text-[48px] font-semibold leading-none text-[#111827]">
                    {activeTopup?.value || "--"}
                  </p>
                  <p className="pb-1 text-[13px] text-[#111827]">credits </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {topupMarks.map((mark, index) => (
                    <button
                      key={`${mark.title}-${mark.value}`}
                      type="button"
                      onClick={() => setSelectedTopupIndex(index)}
                      className={`rounded-xl border px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                        index === selectedTopupIndex
                          ? "border-[#3C6FE8] bg-[#EEF3FF]"
                          : "border-[#E7EDF7] bg-[#F7F9FD]"
                      }`}
                    >
                      <p className="mt-1 text-[13px] text-secondary-db-100 font-semibold">{mark.value} credits</p>
                      <p className="text-[12px]  text-secondary-db-80">{mark.title}</p>
                      
                    </button>
                  ))}
                </div>

                <GlowStarButton
                  onClick={() => goToCheckout(activeTopup?.product?.code || null)}
                  disabled={!activeTopup?.product}
                  className="mt-8 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-secondary-db-20 bg-secondary-db-100 px-5 py-[11px] text-[12px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <span>{activeTopup?.product ? "Purchase credits" : "Starter grant is automatic"}</span>
                </GlowStarButton>


              </div>
            </div>
          </section>

        </div>
      </section>

      <Footer />
    </main>
  );
}
