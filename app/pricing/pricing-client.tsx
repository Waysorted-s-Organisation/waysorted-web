"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlowStarButton from "@/components/GlowStarButton";
import PricingCard from "./components/PricingCard";
import { useUser } from "@/hooks/useUser";
import {
  getCreditPresentation,
  getMinimumAnnualSavingsPercent,
  getPlanUi,
} from "./pricing-presentation";
import { formatMoney } from "@/lib/billing/money";

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
  /** Shown to everyone, buyable only by subscribers. Enforced server-side. */
  requiresSubscription?: boolean;
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

const faqs = [
  {
    question: "What are Waysorted credits?",
    answer:
      "Credits are used for extra or heavier actions inside Waysorted, such as advanced exports, high-compute tools, or future AI-powered actions. In simple terms, credits let you use more without paying for a bigger plan.",
  },
  {
    question: "Do I need a subscription to use Waysorted?",
    answer:
      "No. You can start with credits if you only want to use specific actions. A subscription is better if you want regular monthly credits, full access, and ongoing updates.",
  },
  {
    question: "What is the difference between a plan and credit top-up?",
    answer:
      "A plan gives you monthly access, included credits, and ongoing support. A credit top-up is a one-time purchase for users who want to spend less and pay only when they need extra usage.",
  },
  {
    question: "Do credits expire?",
    answer: "No. Your purchased credits stay with you until you use them. There are no monthly resets on top-up credits.",
  },
  {
    question: "Can I buy credits without upgrading to a paid plan?",
    answer: "Yes. If you are not ready for a monthly plan, you can top-up credits separately and use Waysorted only when your workflow needs it.",
  },
  {
    question: "Which plan should I choose?",
    answer: "Choose Discover if you are just getting started. Choose Core if you want full access for regular design work. Choose Pro if you need more credits, more support, or use Waysorted heavily.",
  },
  {
    question: "What happens when my subscription ends?",
    answer: "You will lose access to paid plan benefits after the subscription ends. Any unused purchased credits should remain available, if that is your intended policy.",
  },
  {
    question: "Can I upgrade later?",
    answer: "Yes. You can start small with credits or a lower plan, then upgrade when you need more access, more credits, or heavier usage.",
  },
  {
    question: "Where can I manage my plan and credits?",
    answer: "Go to Account Settings → Subscription & Plans in your Waysorted Website. You’ll find your active plan, credit balance, billing details, invoices, and top-up options in one place.",
  },
];

function formatCurrency(amountSubunits: number, currency: string) {
  return formatMoney(amountSubunits, currency);
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
  const [selectedTopupIndex, setSelectedTopupIndex] = useState(0);
  const [pricingData, setPricingData] = useState<PricingPayload | null>(initialPricingData);
  const [pricingError, setPricingError] = useState<string | null>(initialPricingError);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    // The server normally supplies the country-aware catalog in the initial HTML.
    // Only use the API as a recovery path if that server render could not build it.
    if (initialPricingData) return;

    let active = true;

    async function loadPricing() {
      setPricingError(null);
      try {
        // Pricing is geo-based only. Always read the public catalog, never the authenticated one:
        // signing in must not change the price, and `user` resolves asynchronously, so switching
        // endpoints on it made the page paint the geo price and then repaint a different one.
        const response = await fetch(`/api/billing/public-catalog?ts=${Date.now()}`, {
          cache: "no-store",
        });
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
    // Deliberately not keyed on `user`: pricing must not change when auth resolves.
  }, [initialPricingData]);

  const subscriptionProducts = useMemo(() => {
    if (!pricingData) return [];
    return sortByCodes(pricingData.catalog, billingCycle === "monthly" ? monthlyCodes : yearlyCodes);
  }, [billingCycle, pricingData]);

  const yearlySavingsPercent = useMemo(() => {
    if (!pricingData) return null;
    return getMinimumAnnualSavingsPercent(
      sortByCodes(pricingData.catalog, monthlyCodes),
      sortByCodes(pricingData.catalog, yearlyCodes),
    );
  }, [pricingData]);

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

  /*
   * What this visitor may actually buy, straight from the authenticated snapshot.
   *
   * The snapshot's catalog IS `getVisibleCatalog({ isNewUser, hasActiveSubscription })`
   * - the same function checkout enforces with - so asking it "what can I buy"
   * gives the identical answer rather than a second guess at subscription status
   * that could drift from it.
   *
   * Signed out, this stays empty and the subscriber rung is view-only, which is
   * the correct default: an anonymous visitor is not a subscriber.
   */
  const [purchasableCodes, setPurchasableCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPurchasableCodes([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/billing/snapshot", { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const codes = (json?.data?.catalog || json?.catalog || []).map(
          (product: { code: string }) => product.code,
        );
        if (active) setPurchasableCodes(codes);
      } catch {
        // Unknown is treated as "not purchasable" - the CTA points at the plans
        // instead of sending someone to a checkout the server would reject.
        if (active) setPurchasableCodes([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, loading]);

  const topupMarks = useMemo(
    () => [
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
      return;
    }

    if (paygMode === "subscriber" && !availablePaygModes.subscriber && availablePaygModes.standard) {
      setPaygMode("standard");
    }
  }, [availablePaygModes.standard, availablePaygModes.subscriber, paygMode, pricingData]);

  /*
   * Whether the rung on screen is one this visitor can actually buy.
   *
   * Switching to the subscriber tier is always allowed - that is the comparison
   * the toggle exists to make. Only the CTA changes: a non-subscriber looking at
   * subscriber pricing is sent to the plans rather than to a checkout that
   * getVisibleCatalog would refuse.
   *
   * Null means the snapshot has not answered yet; treat that as locked so the
   * button never flickers from buyable to not.
   */
  const activeTopupLocked =
    Boolean(activeTopup?.product?.requiresSubscription) &&
    !(purchasableCodes ?? []).includes(activeTopup?.product?.code ?? "");

  function goToCheckout(productCode: string | null) {
    if (!productCode) return;

    /*
     * Second gate, behind the CTA's. A subscriber-only product this visitor
     * cannot buy must never reach /billing: getVisibleCatalog rejects it there,
     * so the customer would land on a dead checkout having been sent by us.
     */
    const requested = pricingData?.catalog.find((item) => item.code === productCode);
    if (requested?.requiresSubscription && !(purchasableCodes ?? []).includes(productCode)) return;

    // Carry the price the customer actually looked at across the hand-off. /pricing may render the
    // unauthenticated catalog (detected country, no pricing lock) while /billing prices from the
    // authenticated snapshot (which honours the lock), so the two can legitimately disagree.
    // Without these fields the billing page re-quotes from its own snapshot and validates that
    // number against itself, which cannot detect the drift the customer would experience.
    const quoted = pricingData?.catalog.find((item) => item.code === productCode);
    const params = new URLSearchParams({ product: productCode, autostart: "1" });
    // Carry a discount code across the hand-off. Without this, a customer who
    // arrived on /pricing with a code silently lost it and was charged full
    // price - the page builds this URL, so anything not added here is dropped.
    //
    // Read from location at click time rather than through useSearchParams.
    // This page is statically prerendered for SEO, and that hook forces the
    // whole subtree out of the prerender unless it sits behind a Suspense
    // fallback - which would empty the pricing content out of the static HTML.
    // The code is only needed when this handler runs, so there is nothing to
    // gain from making it reactive.
    const carriedCoupon =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("coupon")?.trim().toUpperCase();
    if (carriedCoupon) params.set("coupon", carriedCoupon);
    if (quoted && pricingData) {
      params.set("qa", String(quoted.amountPaise));
      params.set("qc", quoted.currency);
      params.set("qv", pricingData.pricingVersion);
    }
    const target = `/billing?${params.toString()}`;

    if (!user && !loading) {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    // Straight to checkout.
    //
    // This used to open a seven-field billing form first. Nothing functional
    // consumes those details: Razorpay owns the invoice, and the only reader in
    // the repo feeds `declaredBillingCountry` into an advisory risk flag that no
    // path blocks, reprices or refuses on. Settings calls them "details for
    // future invoices" and treats them as optional - so this was a form standing
    // between a customer and paying us, for information we do not need to take
    // the payment. They remain addable from settings.
    router.push(target);
  }

  return (
    <main className={`min-h-screen bg-[#F6F7FB] ${showBanner ? "pt-24" : "pt-16"}`}>

      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <section className="px-4 pb-16 pt-6 md:pb-24 md:pt-8">
        <div className="mx-auto w-full max-w-[1120px]">
          <div className="mb-10 flex items-center gap-2 text-[16px] text-[#8A94A6]">
            <Link href="/" className="text-[#8A94A6] hover:text-[#111827] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#8A94A6]" />
            <span className="font-medium text-[#111827] border-b-2 border-[#2F63D7] pb-0.5">Pricing</span>
          </div>

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-[46px] font-semibold leading-[1.15] text-[#111827]">
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
              {yearlySavingsPercent ? (
                <span className="rounded-[999px] bg-[#2F63D7] px-2 py-[3px] text-[10px] font-semibold text-white">
                  Save at least {yearlySavingsPercent}% yearly
                </span>
              ) : null}
            </div>

            <p className="mt-8 text-[14px] text-[#8A94A6]">
              30-day money-back guarantee on all paid plans - no question asked.
            </p>

            {pricingError ? <div className="mt-3 text-[12px] text-[#B42318]">{pricingError}</div> : null}
          </div>

          <section id="pricing-plans" className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {!pricingData
              ? Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={`pricing-placeholder-${index}`}
                    aria-hidden="true"
                    className="min-h-[438px] rounded-[15.31px] border border-[#E7EBF3] bg-white"
                  />
                ))
              : null}
            {subscriptionProducts.map((product) => {
              const ui = getPlanUi(product.code);
              if (!ui) return null;
              const creditPresentation = getCreditPresentation(product);
              return (
                <PricingCard
                  key={product.code}
                  planName={ui.planName}
                  description={ui.description}
                  amountLabel={formatCurrency(product.amountPaise, product.currency)}
                  cycleLabel={billingCycle}
                  creditsLabel={creditPresentation.creditsLabel}
                  ctaLabel={ui.ctaLabel}
                  iconSrc={ui.iconSrc}
                  featured={"featured" in ui ? ui.featured : false}
                  features={ui.features}
                  onSelect={() => goToCheckout(product.code)}
                  bonusCreditsLabel={creditPresentation.bonusCreditsLabel}
                />
              );
            })}
          </section>

          <div className="mx-auto mt-8 max-w-[790px] rounded-[15.31px] border border-[#ECEFF5] bg-white p-6 md:p-3">
            <div className="flex flex-col items-center text-center md:flex-row md:justify-center md:text-left gap-4">
              {/* In the design the lavender tile is the CONTAINER and the gift is a
                  23x25 violet glyph inset inside it, so only the glyph is an asset.
                  The old PNG baked both together at 52px and had no @2x. */}
              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[8px] bg-[#F1EAFE]">
                <Image
                  src="/pricingIcons/credit-topup-gift.svg"
                  alt=""
                  width={22}
                  height={24}
                  className="h-6 w-[22px] object-contain"
                />
              </div>
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
                <span className="text-[15px] font-semibold text-[#111827]">Not ready for a plan?</span> Start with <span className="font-semibold text-[#111827]">Credits top-up</span> and use Waysorted only when your workflow needs it.<br />No subscription or monthly reset required.
              </p>
            </div>
          </div>

          {/* mt-14 (56px) matches the design: the banner ends at y1058 and the
              pay-as-you-go group starts at y1111 in the 1280-wide pricing frame. */}
          <section className="mt-14 flex flex-col gap-8 md:flex-row md:items-stretch md:justify-center md:gap-[50px]">
            <div className="w-full px-[25px] md:px-0 md:w-[434px] md:py-8 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <Image src="/pricingIcons/pay-as-you-go-gift.svg" alt="" width={32} height={32} className="max-h-full max-w-full object-contain" />
                </span>
                <h2 className="text-2xl md:text-[32px] font-medium text-[#111827]">Pay as you go</h2>
              </div>

              <p className="mt-4 w-full md:w-[434px] md:max-w-none text-[16px] font-medium leading-[21px] text-[#7C8798]">
                Top up credits whenever you need extra power for advanced actions. No monthly reset, no wasted balance,
                your credits stay until you use them.
              </p>

              <ul className="mt-6 space-y-4">
                {[
                  "Includes all Premium Waysorted features",
                  "Regular updates with ongoing support",
                  "Credits never expires, reset when needed",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-[#3D4656]">
                    <Image src="/icons/purple.svg" alt="" width={18} height={18} className="mt-0.5 h-[18px] w-[18px]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-auto">
              <div className="flex w-full flex-col rounded-[15.31px] border border-[#E8ECF4] bg-white p-5 md:h-[304px] md:w-[427px] md:px-7 md:py-5">
                <div>
                  <div className="flex flex-wrap items-center justify-start gap-[10px] text-[15px] font-medium">
                    <button
                      type="button"
                      onClick={() => setPaygMode("standard")}
                      className={paygMode === "standard" ? "text-[#111827]" : "text-[#6B7280]"}
                    >
                      Non Subscriber
                    </button>
                    {/* Always switchable: it is a comparison, not a purchase choice.
                        Whether the rung on show can be bought is the CTA's problem. */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={paygMode === "subscriber"}
                      onClick={() => setPaygMode(paygMode === "standard" ? "subscriber" : "standard")}
                      className="relative h-[20px] w-[38px] rounded-full bg-[#111827]"
                      aria-label="Compare subscriber credit pricing"
                    >
                      <span
                        className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-all ${
                          paygMode === "subscriber" ? "left-[20px]" : "left-[2px]"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaygMode("subscriber")}
                      className={paygMode === "subscriber" ? "text-[#111827]" : "text-[#6B7280]"}
                    >
                      Subscribed User
                    </button>
                    <span className="rounded-[999px] bg-[#62B46E] px-2 py-[3px] text-[10px] font-semibold text-white">
                      Low cost
                    </span>
                  </div>

                  <div className="mt-5">
                    {/* 40px at 0% tracking is the design's value; the md:45px step and
                        tracking-tight were both off-spec. */}
                    <p className="text-[40px] font-semibold leading-none text-[#111827]">
                      {activeTopup?.value || "--"} Credits
                    </p>
                  </div>
                </div>

                <div className="mt-4">
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
                      className="pointer-events-none absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full"
                      style={{
                        left: `calc(${sliderPercent}% - 11px)`,
                        background: "linear-gradient(135deg, #8B46FF 0%, #6E2FF4 100%)",
                        boxShadow: "0 0 8px 2px rgba(139, 92, 246, 0.32)",
                      }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
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

                  <div className="relative mt-3 h-[44px]">
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
                          <p className={`text-[18px] font-bold leading-none ${index === clampedTopupIndex ? "text-[#111827]" : "text-[#4B5563]"}`}>
                            {mark.title}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[14px] font-normal leading-none text-[#8A94A6]">{mark.creditsLabel}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeTopupLocked ? (
                  /* Subscriber pricing is visible to everyone, buyable only by
                     subscribers. Send them to the plans rather than to a checkout
                     getVisibleCatalog would refuse. */
                  <div className="mt-auto shrink-0">
                    <GlowStarButton
                      type="button"
                      onClick={() => {
                        document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="h-[42px] w-full rounded-[10px] bg-[#111827] text-[16px] font-semibold text-white cursor-pointer"
                      starCount={18}
                      enterDurationSec={0.35}
                    >
                      Subscribe to unlock
                    </GlowStarButton>
                    <p className="mt-2 text-center text-[12px] leading-[1.35] text-[#8A94A6]">
                      These rates apply once you are on a plan.
                    </p>
                  </div>
                ) : (
                  <GlowStarButton
                    type="button"
                    onClick={() => goToCheckout(activeTopup?.product?.code || null)}
                    disabled={!activeTopup?.product}
                    className="mt-auto h-[42px] w-full rounded-[10px] bg-[#111827] text-[16px] font-semibold text-white disabled:opacity-60 cursor-pointer shrink-0"
                    starCount={18}
                    enterDurationSec={0.35}
                  >
                    Purchase credits
                  </GlowStarButton>
                )}
              </div>
            </div>
          </section>

          <section className="mx-auto mt-24 max-w-[880px]">
            <div className="text-center">
              <h2 className="text-3xl md:text-[36px] font-semibold text-[#111827]">Common Questions</h2>
              <p className="mt-3 text-base md:text-[20px] font-semibold text-[#8A94A6]">Everything you need to know before buying.</p>
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
                      <span className="text-base md:text-[20px] font-medium text-[#111827] text-left">{faq.question}</span>
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
                      <div className="px-5 pb-5 text-[16px] leading-[1.55] text-[#667085] bg-white">{faq.answer}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mx-auto mt-24 max-w-[880px] flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-[30px] font-medium leading-[1.2] text-[#111827]">
              Ready to experience the flow?
            </h2>
            <p className="mt-3 text-sm md:text-[16px] font-medium text-[#8A94A6]">
              Replace multiple plugin subscriptions with one complete Waysorted suite.
            </p>
            <button
              type="button"
              onClick={() => {
                const corePlan = subscriptionProducts[1] || subscriptionProducts[0];
                goToCheckout(corePlan?.code || null);
              }}
              className="relative mt-8 flex h-auto min-h-[72px] md:min-h-0 md:h-[100px] w-full md:w-[650px] max-w-full flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-[20px] bg-[#111827] px-4 py-4 md:py-0 text-2xl md:text-[36px] font-medium text-white overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Bottom white gradient inside the button */}
              <div className="absolute inset-x-0 bottom-0 h-[24px] bg-gradient-to-t from-white/20 to-transparent pointer-events-none group-hover:from-white/30 transition-all" />
              <span className="relative z-10 text-center">
                {/* Never render a hardcoded amount: before the catalog loads the real price may be
                    a different tier and currency entirely, so show no price rather than a wrong one. */}
                Get core
                {subscriptionProducts[1]
                  ? ` — ${formatCurrency(subscriptionProducts[1].amountPaise, subscriptionProducts[1].currency)}/${billingCycle === "monthly" ? "monthly" : "yearly"}`
                  : ""}
              </span>
            </button>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
