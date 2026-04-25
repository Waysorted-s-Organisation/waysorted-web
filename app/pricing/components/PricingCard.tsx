"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import GlowStarButton from "@/components/GlowStarButton";
import type { PlanId } from "@/types/payment";

interface PricingCardProps {
  planId: PlanId;
  planName: string;
  description: string;
  inr: number;
  credits: number;
  bonusCredits: number;
  ctaLabel: string;
  discountTag: string;
  iconSrc: string;
  featured?: boolean;
  features: string[];
}

export default function PricingCard({
  planId,
  planName,
  description,
  inr,
  credits,
  bonusCredits,
  ctaLabel,
  discountTag,
  iconSrc,
  featured = false,
  features,
}: PricingCardProps) {
  const router = useRouter();

  const onGoToPayment = () => {
    router.push(`/payment?plan=${encodeURIComponent(planId)}&billing=monthly`);
  };

  return (
    <article
      className={`rounded-[22px] border p-5 md:p-6 flex flex-col min-h-[478px] transition-all ${
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
            <Image src={iconSrc} alt={`${planName} icon`} width={12} height={12} className="h-3 w-3 object-contain" />
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
        className={`mt-2 text-[12px] leading-snug max-w-[250px] ${
          featured ? "text-white/95" : "text-[#606A7C]"
        }`}
      >
        {description}
      </p>

      <div className="mt-2.5">
        <p className={`text-[22px] font-medium leading-none ${featured ? "text-white/65 line-through" : "text-[#A3ABB9] line-through"}`}>
          ₹{Math.round(inr * 1.14)}
        </p>
      </div>

      <div className="mt-1.5 flex items-end">
        <p className="text-[49px] font-semibold leading-none tracking-[-0.03em]">₹{inr}</p>
        <span className={`mb-1 ml-1 text-[26px] ${featured ? "text-white/85" : "text-[#606A7C]"}`}>/monthly</span>
      </div>

      <GlowStarButton
        onClick={onGoToPayment}
        className={`mt-5 inline-flex w-full items-center justify-center border text-[13px] font-semibold px-4 py-[10px] rounded-[10px] active:scale-95 transition-transform cursor-pointer ${
          featured
            ? "force-hover bg-white !text-[#2557DE] border-white"
            : "bg-[#EDF2FF] !text-[#2E56CC] border-[#DCE5FF]"
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
          <span className={`inline-flex h-4 w-4 rounded-full border ${featured ? "border-white/60" : "border-[#6D89DA]"} items-center justify-center text-[11px]`}>
            ⏱
          </span>
          {credits.toLocaleString()} credits/month
        </p>
        <p className={`mt-1 text-[11px] ${featured ? "text-white/80" : "text-[#6A7387]"}`}>
          Plus {bonusCredits} bonus credits for new users
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
