"use client";

import { useEffect, useRef, useState } from "react";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingCard from "./components/PricingCard";
import GlowStarButton from "@/components/GlowStarButton";
import Image from "next/image";

const subscriptionPlans = [
  {
    planId: "starter" as const,
    planName: "Discover",
    description: "Best for new users getting started with Waysorted ecosystem.",
    inr: 149,
    credits: 220,
    bonusCredits: 25,
    ctaLabel: "Build Plan",
    discountTag: "Save 20%",
    iconSrc: "/icons/lightning-blue.svg",
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expires, no monthly resets.",
    ],
  },
  {
    planId: "pro" as const,
    planName: "Core",
    description: "Perfect for agencies who need AI automation and scaling workflows.",
    inr: 349,
    credits: 800,
    bonusCredits: 50,
    ctaLabel: "Get Started",
    discountTag: "Save 24%",
    iconSrc: "/icons/infinity-icon.svg",
    featured: true,
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expires, no monthly resets.",
    ],
  },
  {
    planId: "scale" as const,
    planName: "Pro",
    description: "For high-growth teams and enterprises with advanced needs.",
    inr: 749,
    credits: 1200,
    bonusCredits: 100,
    ctaLabel: "Build Plan",
    discountTag: "Save 19%",
    iconSrc: "/icons/grid-icon.svg",
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expires, no monthly resets.",
    ],
  },
];

const faqItems = [
  "What is Waysorted?",
  "How is Waysorted different from other app or plugin services?",
  "What tools do I have are included?",
  "Who create these tools pack?",
  "Can I suggest tools to be included?",
  "Will Waysorted slow down my Figma?",
  "Is Waysorted safe and secure?",
  "What if I face issue while using Waysorted?",
  "How do I get started?",
];

const paygModes = {
  firstPurchase: {
    marks: [
      { title: "Free", value: "15 credits", price: 0, credits: 15 },
      { title: "Rs. 50", value: "40 credits", price: 50, credits: 40 },
      { title: "Rs. 100", value: "90 credits", price: 100, credits: 90 },
      { title: "Rs. 120", value: "110 credits", price: 120, credits: 110 },
    ],
  },
  subscriber: {
    marks: [
      { title: "Free", value: "20 credits", price: 0, credits: 20 },
      { title: "Rs. 50", value: "50 credits", price: 50, credits: 50 },
      { title: "Rs. 100", value: "105 credits", price: 100, credits: 105 },
      { title: "Rs. 120", value: "130 credits", price: 120, credits: 130 },
    ],
  },
} as const;
const trackEdgeInsetPx = 18;

export default function PricingPage() {
  const { showBanner, setShowBanner } = useBanner();
  const [activeFaq, setActiveFaq] = useState<number>(0);
  const [paygMode, setPaygMode] = useState<"firstPurchase" | "subscriber">("firstPurchase");
  const [selectedTierIndex, setSelectedTierIndex] = useState(1);
  const [anchorPercents, setAnchorPercents] = useState<number[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const markRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const payg = paygModes[paygMode];
  const maxTierIndex = payg.marks.length - 1;
  const clampedTierIndex = Math.max(0, Math.min(selectedTierIndex, maxTierIndex));
  const activeTier = payg.marks[clampedTierIndex];
  const fallbackTierPositions = payg.marks.map((_, index) =>
    maxTierIndex === 0 ? 0 : (index / maxTierIndex) * 100
  );
  const measuredPercent = anchorPercents[clampedTierIndex] ?? fallbackTierPositions[clampedTierIndex] ?? 0;
  const sliderPercent =
    clampedTierIndex === 0 ? 0 : clampedTierIndex === maxTierIndex ? 100 : measuredPercent;

  useEffect(() => {
    const measureAnchors = () => {
      const track = trackRef.current;
      if (!track) return;

      const trackRect = track.getBoundingClientRect();
      if (trackRect.width <= 0) return;

      const nextPercents = payg.marks.map((_, index) => {
        if (index === 0) return 0;
        if (index === maxTierIndex) return 100;

        const markEl = markRefs.current[index];
        if (!markEl) return fallbackTierPositions[index] ?? 0;

        const markRect = markEl.getBoundingClientRect();
        const centerX = markRect.left + markRect.width / 2;
        const rawPercent = ((centerX - trackRect.left) / trackRect.width) * 100;
        return Math.max(0, Math.min(100, rawPercent));
      });

      setAnchorPercents(nextPercents);
    };

    const frameId = requestAnimationFrame(measureAnchors);
    window.addEventListener("resize", measureAnchors);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureAnchors);
    };
  }, [paygMode, payg.marks, fallbackTierPositions]);

  return (
    <main className={`min-h-screen bg-[#F5F7FC] transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"}`}>
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <section className="w-full px-4 pb-16 pt-10 md:pb-20 md:pt-14">
        <div className="mx-auto w-full max-w-[1040px]">
          <div className="text-center mb-8">
            <h1 className="text-[42px] leading-[1.1] font-semibold text-secondary-db-100 tracking-[-0.02em]">
              Choose the perfect plan for your workflow
            </h1>
            <p className="mt-3 text-[13px] text-[#7A8499] max-w-3xl mx-auto">
              Unlock smarter workflows with flexible plans built for creators and teams.
            </p>

            <div className="mx-auto mt-5 inline-flex items-center rounded-full border border-[#E3E9F5] bg-white p-1 text-xs font-medium text-[#5E6A7B]">
              <button className="rounded-full bg-[#EEF3FF] px-5 py-1.5 text-[#2F67FF] shadow-sm">Monthly</button>
              <button className="rounded-full px-5 py-1.5">Yearly</button>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {subscriptionPlans.map((plan) => (
              <PricingCard
                key={plan.planId}
                planId={plan.planId}
                planName={plan.planName}
                description={plan.description}
                inr={plan.inr}
                credits={plan.credits}
                bonusCredits={plan.bonusCredits}
                ctaLabel={plan.ctaLabel}
                discountTag={plan.discountTag}
                iconSrc={plan.iconSrc}
                featured={plan.featured}
                features={plan.features}
              />
            ))}
          </section>

          <section className="mt-5 rounded-2xl border border-[#E7EDF7] bg-white p-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_1fr]">
              <div>
                <p className="flex items-center gap-2 text-[42px] leading-none font-semibold tracking-[-0.02em] text-secondary-db-100">
                  <Image src="/icons/gifts.svg" alt="" width={20} height={20} className="h-5 w-5" />
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
                <div className="flex items-center justify-start gap-2.5 text-[12px] text-[#111827]">
                  <button
                    type="button"
                    onClick={() => setPaygMode("firstPurchase")}
                    className={`font-medium ${paygMode === "firstPurchase" ? "text-[#111827]" : "text-[#6B7280]"}`}
                  >
                    First Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaygMode("subscriber")}
                    className="relative h-6 w-11 rounded-full bg-[#111827]"
                    aria-label="Toggle subscriber mode"
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        paygMode === "subscriber" ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaygMode("subscriber")}
                    className={`font-medium ${paygMode === "subscriber" ? "text-[#111827]" : "text-[#6B7280]"}`}
                  >
                    Subscriber
                  </button>
                  <span className="rounded-full bg-[#16A34A] px-3 py-1 text-[11px] font-semibold text-white">
                    Extra Credits
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <p className="text-[48px] font-semibold leading-none text-[#111827]">₹{activeTier.price}</p>
                  <p className="pb-1 text-[13px] text-[#111827]">for {activeTier.credits} credits</p>
                </div>

                <div className="mt-6" style={{ paddingLeft: trackEdgeInsetPx, paddingRight: trackEdgeInsetPx }}>
                  <div ref={trackRef} className="relative h-1.5 rounded-full bg-[#DCE6FA]">
                    <div className="h-1.5 rounded-full bg-[#3C6FE8]" style={{ width: `${sliderPercent}%` }} />
                    <span
                      className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#3C6FE8] bg-white"
                      style={{ left: `${sliderPercent}%` }}
                    />
                  </div>
                </div>

                <div
                  className="mt-5 grid grid-cols-4 gap-0 text-left"
                  style={{ paddingLeft: trackEdgeInsetPx, paddingRight: trackEdgeInsetPx }}
                >
                  {payg.marks.map((mark, index) => (
                    <button
                      key={`${mark.title}-${index}`}
                      type="button"
                      onClick={() => setSelectedTierIndex(index)}
                      ref={(el) => {
                        markRefs.current[index] = el;
                      }}
                      className={`text-left text-[#111827] ${
                        index === 0 ? "justify-self-start" : index === maxTierIndex ? "justify-self-end" : "justify-self-center"
                      }`}
                    >
                      <p className={`text-[14px] font-semibold leading-none ${index === clampedTierIndex ? "text-[#111827]" : "text-[#374151]"}`}>
                        {mark.title}
                      </p>
                      <p className={`mt-1 text-[13px] ${index === clampedTierIndex ? "text-[#4B5563]" : "text-[#6B7280]"}`}>{mark.value}</p>
                    </button>
                  ))}
                </div>

                <GlowStarButton className="mt-8 inline-flex w-full items-center justify-center border bg-secondary-db-100 border-secondary-db-20 text-white font-semibold text-[12px] px-5 py-[11px] rounded-xl active:scale-95 transition-transform cursor-pointer force-hover">
                  <span>Purchase credits</span>
                </GlowStarButton>
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[34px] font-semibold text-center text-secondary-db-100">
              <span className="bg-[#EAF1FF] px-2 py-0.5 rounded-md">Top</span> Frequently Asked Questions
            </h2>
            <p className="mt-2 text-center text-[12px] text-[#7A8499]">
              Get quick answers to the most frequently asked questions about our products, services and policies.
            </p>

            <div className="mx-auto mt-6 max-w-[930px] rounded-2xl border border-[#E7EDF7] bg-white p-3 md:p-4">
              {faqItems.map((item, idx) => (
                <button
                  key={item}
                  onClick={() => setActiveFaq(idx)}
                  className="w-full rounded-xl border border-[#EEF2FA] bg-white px-4 py-3 text-left hover:bg-[#F8FAFF] mb-2 last:mb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-secondary-db-100">{item}</span>
                    <span className="text-[16px] leading-none text-[#667085]">{activeFaq === idx ? "⌃" : "⌄"}</span>
                  </div>
                  {activeFaq === idx && (
                    <p className="mt-2 pr-8 text-[11px] leading-relaxed text-[#667085]">
                      Waysorted is a design and productivity suite made to simplify your workflow by combining multiple
                      tools in one place. It helps individuals and teams work faster with automation, AI support and
                      easy collaboration.
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-16 text-center">
            <h3 className="text-[48px] leading-none font-semibold text-secondary-db-100">Join Our Community</h3>
            <p className="mx-auto mt-3 max-w-4xl text-[12px] text-[#6F7788]">
              Be part of a growing network of designers who believe in faster, smarter, and frustration-free workflows.
            </p>
            <div className="relative mx-auto mt-8 w-full max-w-[640px]">
              <button className="relative z-10 h-[116px] w-full rounded-[24px] border border-[#111111] bg-[linear-gradient(180deg,#070707_0%,#050505_42%,#020202_100%)] text-[58px] leading-none font-semibold text-white shadow-[inset_0_-14px_28px_rgba(120,120,120,0.22)]">
                Join Now !
              </button>
              <div className="pointer-events-none absolute inset-x-8 -bottom-3 h-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(160,160,160,0.5)_0%,rgba(160,160,160,0)_70%)] blur-md" />
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
