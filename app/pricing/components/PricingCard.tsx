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
  discountTag?: string;
  iconSrc: string;
  featured?: boolean;
  features: readonly string[];
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
      className={`flex h-full flex-col rounded-[15.31px] border p-4 md:p-5 ${
        featured
          ? "border-[#2B5FD3] bg-[#2F63D7] text-white"
          : "border-[#E7EBF3] bg-white text-[#111827]"
      }`}
    >
      {/* The discount pill shares the title row, as it does in the design. It used to
          sit beside the title+description column, which forced the description into a
          250px cap and pushed the longest one (Core) onto a third line. */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 h-[42px]">
            {/* The three marks are genuinely different shapes in the design (24x24,
                22x19, 21x25). A fixed box that centres them keeps the three cards
                optically aligned; sizing the <img> itself let flex-shrink and the
                intrinsic ratio fight over the width. */}
            <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
              <Image src={iconSrc} alt="" width={24} height={24} className="max-h-full max-w-full object-contain" />
            </span>
            <h3 className="text-[32px] font-semibold leading-[42px]">{planName}</h3>
          </div>

          {discountTag ? (
            <span className="rounded-[6px] bg-[#10B058] px-2.5 py-1 text-[10px] font-bold leading-none text-white whitespace-nowrap shrink-0 uppercase tracking-wider">
              {discountTag}
            </span>
          ) : null}
        </div>

        <p
          className={`mt-3 text-[14px] font-medium leading-[21px] h-[54px] ${
            featured ? "text-white/85" : "text-[#6B7280]"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="mt-[5px] md:mt-4">
        <div className="h-[20px] flex items-end">
          {originalAmountLabel ? (
            <p className={`text-[13px] line-through leading-none ${featured ? "text-white/65" : "text-[#98A2B3]"}`}>
              {originalAmountLabel}
            </p>
          ) : null}
        </div>

        <div className="mt-1 flex items-end gap-1.5 h-[36px]">
          <p className="text-[36px] font-semibold leading-none">{amountLabel}</p>
          <span className={`pb-0.5 text-[16px] font-medium leading-[21px] ${featured ? "text-white/75" : "text-[#6B7280]"}`}>
            /{cycleLabel}
          </span>
        </div>
      </div>

      <GlowStarButton
        type="button"
        onClick={onSelect}
        className={`mt-4 h-[44px] rounded-[10px] text-[16px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0 ${
          featured
            ? "bg-white/15 text-white hover:bg-white/20 border border-white/10"
            : "bg-[#EAF1FF] !text-[#4B73D8] hover:bg-[#DCE7FF]"
        }`}
        starCount={14}
        enterDurationSec={0.35}
      >
        {ctaLabel}
      </GlowStarButton>

      {/* Dotted/Dashed Separator Line inside the card */}
      <div className={`my-4 border-t border-dashed shrink-0 ${featured ? "border-white/20" : "border-[#E7EBF3]"}`} />

      <div
        className={`rounded-[12px] px-4 py-2.5 shrink-0 ${
          featured ? "bg-[#1E4BB5] text-white" : "bg-[#F6F8FC] text-[#111827]"
        }`}
      >
        <p className="flex items-center gap-2 text-[14px] font-medium leading-[21px]">
          <Image
            src={featured ? "/icons/c-blue.svg" : "/icons/c.svg"}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0"
          />
          {creditsLabel}
        </p>
        <p className={`mt-1 text-[12px] leading-[1.35] h-[16px] ${featured ? "text-white/80" : "text-[#8A94A6]"}`}>
          {bonusCreditsLabel}
        </p>
      </div>

      <ul className="mt-4 space-y-3 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
              <Image
                src={featured ? "/icons/white check.svg" : "/icons/blue check.svg"}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4"
              />
            </span>
            <span className={`text-[12px] leading-[1.35] ${featured ? "text-white/88" : "text-[#3D4656]"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
