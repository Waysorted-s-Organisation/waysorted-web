"use client";

import Image from "next/image";
import GlowStarButton from "@/components/GlowStarButton";

interface PricingCardProps {
  planName: string;
  description: string;
  originalAmountLabel?: string;
  amountLabel: string;
  cycleLabel: string;
  creditsLabel: string;
  ctaLabel: string;
  discountTag: string;
  iconSrc: string;
  featured?: boolean;
  features: string[];
  onSelect: () => void;
  bonusCreditsLabel?: string;
}

export default function PricingCard({
  planName,
  description,
  originalAmountLabel,
  amountLabel,
  cycleLabel,
  creditsLabel,
  ctaLabel,
  discountTag,
  iconSrc,
  featured = false,
  features,
  onSelect,
  bonusCreditsLabel,
}: PricingCardProps) {
  return (
    <article
      className={`relative group flex min-h-[478px] flex-col rounded-[22px] border-5 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(25,40,86,0.12)] md:p-6 ${
        featured
          ? "border-primary-way-90 bg-primary-way-100 text-white"
          : "border-secondary-db-5 bg-white text-secondary-db-100"
      }`}
    >
      <span
        className="absolute right-4 top-4 z-10 rounded-md bg-[#01A04E] px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-white"
      >
        {discountTag}
      </span>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
              featured ? "bg-white/20" : "bg-[#EDF2FF]"
            }`}
          >
            <Image
              src={iconSrc}
              alt={`${planName} icon`}
              width={12}
              height={12}
              className="h-3 w-3 object-contain transition-transform duration-300 group-hover:rotate-6"
            />
          </span>
          <p className="text-3xl font-semibold leading-none tracking-[-0.03em]">{planName}</p>
        </div>
      </div>

      <p
        className={`mt-2 max-w-[250px] text-[16px] leading-snug ${
          featured ? "text-white/95" : "text-secondary-db-60"
        }`}
      >
        {description}
      </p>

      <div className="mt-8">
        {originalAmountLabel ? (
          <p className={`text-[16px] line-through ${featured ? "text-white/75" : "text-secondary-db-60"}`}>
            {originalAmountLabel}
          </p>
        ) : null}

        <div className="mt-3 flex items-end">
        <p className="text-[36px] font-semibold leading-none tracking-[-0.03em]">{amountLabel}</p>
        <span className={`mb-1 ml-1 text-[14px] ${featured ? "text-white/85" : "text-secondary-db-60"}`}>
          /{cycleLabel}
        </span>
        </div>
      </div>

      <GlowStarButton
        onClick={onSelect}
        className={`mt-5 inline-flex w-full items-center justify-center rounded-[10px] border border-transparent px-4 py-[10px] text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
          featured
            ? "force-hover bg-primary-way-80"
            : "border-[#DCE5FF] bg-primary-way-10 !text-primary-way-100"
        }`}
      >
        <span>{ctaLabel}</span>
      </GlowStarButton>

      <div
        className={`mt-4 rounded-[12px]  px-4 py-3 ${
          featured ? " bg-primary-way-90 text-white" : "bg-primary-way-5 text-secondary-db-100"
        }`}
      >
        <p className="flex items-center gap-1 text-[16px] font-semibold leading-tight">
          <span
            className={`inline-flex  items-center justify-center`}
          >
            <Image
            src={featured ? "/icons/c-blue.svg" : "/icons/c.svg"}
            alt={`${planName} icon`}
            width={18}
            height={18}
            className="object-contain transition-transform duration-300 group-hover:rotate-6"
          />
          </span>
          {creditsLabel}
        </p>
        <p className={`mt-1 text-[14px] ${featured ? "text-primary-way-5" : "text-secondary-db-70"}`}>
          {bonusCreditsLabel || "Credits are granted only after Razorpay webhook confirmation."}
        </p>
      </div>

      <ul className="mt-4 space-y-2 text-[12px] leading-tight">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span
              className={`mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-transform duration-200 group-hover:scale-110 ${
                featured ? "bg-white text-[#2F67FF]" : "bg-[#2F67FF] text-white"
              }`}
            >
              <Image
                src={featured ? "/icons/tick-blue.svg" : "/icons/tick.svg"}
                alt=""
                width={8}
                height={8}
                className="object-contain transition-transform duration-300 group-hover:rotate-6"
              />
            </span>
            <span className={featured ? "text-white/95 text-[14px]" : "text-[#2F3749] text-[14px]"}>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
