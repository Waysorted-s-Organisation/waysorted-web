"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { IUser } from "@/models/user";

type Props = {
  user: IUser;

  // Referral config (override via props if needed)
  creditPerReferral?: number; // how much you earn per referral
  maxReferrals?: number; // cap on counted referrals
  friendReward?: number; // what your friend gets when subscribing
  yourReward?: number; // what you get per referral (alias for creditPerReferral for copy text)
  explicitReferralLink?: string; // pass if you already have a permalink from backend
};

export default function ReferAndEarnCard({
  creditPerReferral = 200,
  maxReferrals = 10,
  friendReward = 50,
  yourReward,
  explicitReferralLink,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Prefer provided link; otherwise synthesize from code or id
  const referralLink = useMemo(() => {
    if (explicitReferralLink) return explicitReferralLink;

    const code ="your-code";

    if (typeof window !== "undefined") {
      return `${window.location.origin}/invite/${code}`;
    }
    return `https://your.app/invite/${code}`;
  }, [explicitReferralLink]);

  const totalPotential = creditPerReferral * maxReferrals;
  const youGet = yourReward ?? creditPerReferral;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      {/* Header */}
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Refer &amp; Earn</h1>
        <p className="text-sm text-secondary-db-80 font-medium">
          Earn a total {creditPerReferral} Credits per refer, up to {maxReferrals} refers
        </p>
      </header>

      <div className="px-6 pb-6 pt-5">
        {/* Hero / Banner */}
        <div className="rounded-md border border-secondary-db-5 bg-secondary-db-5/30 p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <span className="inline-flex w-fit items-center rounded-full border border-primary-way-20 bg-primary-way-10 px-3 py-1 text-xs font-medium text-primary-way-100">
                Earn {Intl.NumberFormat("en", { notation: "compact" }).format(totalPotential)}+ credits
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-secondary-db-100">
                Refer &amp; Earn
              </h2>
              <p className="mt-1 text-sm text-secondary-db-80">
                Share your invite link and start earning credits when your friends subscribe.
              </p>
            </div>

            {/* Graphic placeholder */}
            <div className="mt-2 hidden h-28 w-full items-center justify-center rounded-md border border-secondary-db-5 text-secondary-db-70 md:mt-0 md:flex md:w-64">
              graphic image
            </div>
          </div>
        </div>

        {/* Share your link */}
        <div className="mt-6">
          <label
            htmlFor="ref-link"
            className="mb-2 block text-sm font-medium text-secondary-db-90"
          >
            Share your link
          </label>

          <div className="flex items-stretch overflow-hidden rounded-md border border-secondary-db-5">
            <input
              id="ref-link"
              value={referralLink}
              readOnly
              className="w-full bg-white px-3 py-2 text-sm text-secondary-db-100 outline-none"
            />
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-2 border-l border-secondary-db-5 bg-secondary-db-0 px-3 py-2 text-sm font-medium text-primary-way-100 hover:bg-primary-way-10"
              aria-label="Copy referral link"
              title="Copy referral link"
            >
              <CopyIcon />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-secondary-db-80">How it works:</h3>
          <ul className="flex list-none flex-col gap-3">
            <li className="flex items-start gap-2 text-sm text-secondary-db-90">
              <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-secondary-db-5 bg-white">
                <Image
                  src="/icons/light-black.svg"
                  alt="Share Icon"
                  width={14}
                  height={14}
                />
              </span>
              <span className="font-regular">Share invite link or invite via email</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-secondary-db-90">
              <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-secondary-db-5 bg-white">
                  <Image
                    src="/icons/bomb.svg"
                    alt="Gift Icon"
                    width={14}
                    height={14}
                  />
              </span>
              <span className="font-regular">Your friends get <span className="text-secondary-db-100 font-semibold">{friendReward} credits</span> when they subscribe</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-secondary-db-90">
              <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-secondary-db-5 bg-white">
                  <Image
                    src="/icons/gifts.svg"
                    alt="Coins Icon"
                    width={14}
                    height={14}
                  />
              </span>
              <span className="font-regular">You receive <span className="text-secondary-db-100 font-semibold">{youGet} credits</span> for each referral</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* Inline icons to avoid asset dependencies */
function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="text-primary-way-100"
      {...props}
    >
      <path d="M9 9.5A2.5 2.5 0 0 1 11.5 7H18a2 2 0 0 1 2 2v6.5A2.5 2.5 0 0 1 17.5 18H11a2 2 0 0 1-2-2V9.5Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 16.5A2.5 2.5 0 0 1 4.5 14V7a2 2 0 0 1 2-2H13.5A2.5 2.5 0 0 1 16 7.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
