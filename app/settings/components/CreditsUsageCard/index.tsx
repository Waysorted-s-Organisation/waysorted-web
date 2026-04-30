"use client";

import Image from "next/image";
import Link from "next/link";
import type { User } from "@/hooks/useUser";

type Props = {
  user: User;
};

export default function CreditsUsageCard({ user }: Props) {
  const wallet = user.billing?.wallet;
  const subscription = user.billing?.subscription;
  const subscriptionStatus = subscription?.status || "inactive";
  const hasSubscriptionAccess = ["active", "cancel_scheduled", "payment_pending"].includes(subscriptionStatus);
  const activePlanCode = hasSubscriptionAccess ? subscription?.planCode || null : null;
  const activePlan = activePlanCode ? user.billing?.catalog?.find((plan) => plan.code === activePlanCode) : null;

  const purchasedCredits = Math.max(0, wallet?.lifetimePurchasedCredits || 0);
  const bonusCredits = Math.max(0, wallet?.lifetimeBonusCredits || 0);
  const spentCredits = Math.max(0, wallet?.lifetimeSpentCredits || 0);
  const refundedCredits = Math.max(0, wallet?.lifetimeRefundedCredits || 0);
  const heldCredits = Math.max(0, wallet?.heldCredits || 0);
  const remainingCredits = Math.max(0, wallet?.availableCredits ?? user.creditsRemaining ?? 0);
  const totalCredits = Math.max(
    remainingCredits + heldCredits + spentCredits,
    purchasedCredits + bonusCredits - refundedCredits,
    remainingCredits,
  );

  const renewsAt = subscription?.renewsAt;
  const isAboutToExpire = !!(
    hasSubscriptionAccess &&
    renewsAt &&
    new Date(renewsAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
  );

  const getButtonText = () => {
    if (!hasSubscriptionAccess && totalCredits === 0) return "Get started";
    if (hasSubscriptionAccess) return isAboutToExpire ? "Upgrade plan" : "Top up credits";
    return "View plans";
  };

  const getButtonClasses = () => {
    if (hasSubscriptionAccess) {
      if (isAboutToExpire) return "text-[#B20000] border border-[#B20000] hover:bg-red-50";
      return "bg-white text-primary-way-100 border border-primary-way-10 shadow-sm hover:bg-primary-way-5";
    }
    if (remainingCredits === 0) return "text-[#B20000] border border-[#B20000] hover:bg-red-50";
    return "text-primary-way-100 hover:bg-primary-way-200 border border-primary-way-100";
  };

  // Compute total and used credits dynamically
  const total = totalCredits;
  const remaining = remainingCredits;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const used = total - remaining;


  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      {/* Header */}
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h2 className="text-base font-medium text-secondary-db-100">Credits Usage</h2>
        <p className="text-sm text-secondary-db-80 font-medium">
          Track and manage your Waysorted credits with ease
        </p>
      </header>

      <div className="px-11 pb-8 pt-8">
        {/* Summary bar */}
        <div className={`flex flex-col gap-4 rounded-md border px-4 py-4 md:flex-row md:items-center md:justify-between transition-colors ${
          remainingCredits === 0 
            ? "bg-[#FEEAEB] border-none" 
            : "border-secondary-db-5"
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center">
              <Image
                src={remainingCredits === 0 ? "/icons/red-clock.svg" : "/icons/clock.svg"}
                alt="Credits Icon"
                width={16}
                height={19}
                className="object-contain"
                onError={(e) => {
                  // Fallback if clock-red doesn't exist
                  (e.target as HTMLImageElement).src = "/icons/clock.svg";
                }}
              />
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-semibold ${
                remainingCredits === 0 ? "text-[#B20000]" : "text-secondary-db-90"
              }`}>
                {remainingCredits}
              </span>
              <span className={`text-sm font-medium ${
                remainingCredits === 0 ? "text-[#B20000]" : "text-secondary-db-90"
              }`}>
                / {totalCredits} credits left
              </span>
            </div>
          </div>

          <Link 
            href="/pricing" 
            className={`inline-flex items-center rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${getButtonClasses()}`}
          >
            {getButtonText()}
          </Link>
        </div>

        {/* Conditional Panels */}

        {((!hasSubscriptionAccess && totalCredits === 0) || isAboutToExpire) ? (
          <div className="pt-4 pb-4 pl-6 bg-[#FEEAEB] mt-4 rounded-md border border-red-100">
            <div className=" text-sm text-[#B20000] font-medium flex items-center gap-2">
              <Image
                src={isAboutToExpire ? "/icons/info-red.svg" : "/icons/red-clock.svg"}
                alt="Info Icon"
                width={16}
                height={16}
                className="object-contain"
              />
              {totalCredits === 0 && !hasSubscriptionAccess
                ? "Your free account starts with 300 credits after the billing checks complete."
                : isAboutToExpire
                  ? "Your subscription is about to expire soon. Upgrade now to keep your premium benefits."
                  : "Your credits are over. Upgrade to a plan to continue."
              }
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col space-y-4 rounded-md border border-blue-100 bg-primary-way-10 p-4">
            <div className="flex items-start gap-4">
              <Image
                src="/icons/info-1.svg"
                alt="Info Icon"
                width={20}
                height={20}
                className="object-contain mt-0.5"
              />
              <p className="text-sm text-primary-way-100 leading-relaxed">
                {activePlanCode 
                  ? `You're on the ${activePlan?.name || "Premium"} plan! You have full access to all features. Top up more credits if you need to keep your workflow moving fast.`
                  : "You're on the Free plan! Enjoy your starter credits and full Waysorted access while you explore the workflow."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
