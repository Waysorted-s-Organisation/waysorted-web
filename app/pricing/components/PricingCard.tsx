"use client";

import Image from "next/image";
import GlowStarButton from "@/components/GlowStarButton";

interface PricingCardProps {
  planName: string;
  description: string;
  amountLabel: string;
  cycleLabel: string;
  creditsLabel: string;
  ctaLabel: string;
  discountTag: string;
  iconSrc: string;
  featured?: boolean;
  features: string[];
  onSelect: () => void;
}

export default function PricingCard({
  planName,
  description,
  amountLabel,
  cycleLabel,
  creditsLabel,
  ctaLabel,
  discountTag,
  iconSrc,
  featured = false,
  features,
  onSelect,
}: PricingCardProps) {
  return (
    <article
      className={`flex min-h-[478px] flex-col rounded-[22px] border p-5 transition-all md:p-6 ${
        featured
          ? "border-[#356DFF] bg-[#356DFF] text-white"
          : "border-[#E7EDF7] bg-white text-secondary-db-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              featured ? "bg-white/20" : "bg-[#EDF2FF]"
            }`}
          >
            <Image
              src={iconSrc}
              alt={`${planName} icon`}
              width={12}
              height={12}
              className="h-3 w-3 object-contain"
            />
          </span>
          <p className="text-[40px] font-semibold leading-none tracking-[-0.03em]">{planName}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            featured ? "bg-[#7FA4FF] text-white" : "bg-[#E8F8EC] text-[#16A34A]"
          }`}
        >
          {discountTag}
        </span>
      </div>

      <p
        className={`mt-2 max-w-[250px] text-[12px] leading-snug ${
          featured ? "text-white/95" : "text-[#606A7C]"
        }`}
      >
        {description}
      </p>

      <div className="mt-8 flex items-end">
        <p className="text-[49px] font-semibold leading-none tracking-[-0.03em]">{amountLabel}</p>
        <span className={`mb-1 ml-1 text-[22px] ${featured ? "text-white/85" : "text-[#606A7C]"}`}>
          /{cycleLabel}
        </span>
      </div>

      <GlowStarButton
        onClick={onSelect}
        className={`mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-[10px] border px-4 py-[10px] text-[13px] font-semibold transition-transform active:scale-95 ${
          featured
            ? "force-hover border-white bg-white !text-[#2557DE]"
            : "border-[#DCE5FF] bg-[#EDF2FF] !text-[#2E56CC]"
        }`}
      >
        <span>{ctaLabel}</span>
      </GlowStarButton>

      <div className={`mt-4 ${featured ? "dashed-line-white" : "dashed-line"} opacity-70`} />

      <div
        className={`mt-4 rounded-[12px] border px-4 py-3 ${
          featured ? "border-[#87A9FF] bg-[#4A7CFF] text-white" : "border-[#E7EDF7] bg-[#F7F9FD] text-[#2D3648]"
        }`}
      >
        <p className="flex items-center gap-2 text-[15px] font-semibold leading-tight">
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[11px] ${
              featured ? "border-white/60" : "border-[#6D89DA]"
            }`}
          >
            C
          </span>
          {creditsLabel}
        </p>
        <p className={`mt-1 text-[11px] ${featured ? "text-white/80" : "text-[#6A7387]"}`}>
          Credits are granted only after Razorpay webhook confirmation.
        </p>
      </div>

      <ul className="mt-4 space-y-2 text-[12px] leading-tight">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span
              className={`mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                featured ? "bg-white text-[#2F67FF]" : "bg-[#2F67FF] text-white"
              }`}
            >
              ✓
            </span>
            <span className={featured ? "text-white/95" : "text-[#2F3749]"}>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
