"use client";

import { useState } from "react";
import { hasSubscriptionEntitlement, isLiveSubscriptionStatus } from "@/lib/billing/subscription-status";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@/hooks/useUser";
import BillingHistoryModal from "@/components/BillingHistoryModal";
import { formatMoney } from "@/lib/billing/money";

type Props = {
  user: User;
  onEditBilling?: () => void;
};

export default function SubscriptionCard({ user, onEditBilling }: Props) {
  const wallet = user.billing?.wallet;
  const subscription = user.billing?.subscription;
  const subscriptionStatus = subscription?.status || "inactive";
  const subscriptionPlanCode = subscription?.planCode || null;
  // Entitlement, not existence. This omitted "scheduled" - where every
  // discounted subscription rests for its entire first cycle - so a customer who
  // had just paid with a code saw no plan, no start date, and no way to cancel.
  const hasSubscriptionAccess = hasSubscriptionEntitlement(subscriptionStatus);
  // Cancelling is a separate question: payment_pending and halted have NOT
  // earned the plan's benefits but are both still cancellable, so gating the
  // control on entitlement stranded those customers too.
  const canCancelSubscription = isLiveSubscriptionStatus(subscriptionStatus);
  const activePlanCode = hasSubscriptionAccess ? subscriptionPlanCode : null;
  const activePlan = activePlanCode ? user.billing?.catalog?.find((plan) => plan.code === activePlanCode) : null;

  const purchasedCredits = Math.max(0, wallet?.lifetimePurchasedCredits || 0);
  const bonusCredits = Math.max(0, wallet?.lifetimeBonusCredits || 0);
  const spentCredits = Math.max(0, wallet?.lifetimeSpentCredits || 0);
  const refundedCredits = Math.max(0, wallet?.lifetimeRefundedCredits || 0);
  const heldCredits = Math.max(0, wallet?.heldCredits || 0);
  const dbAvailable = Math.max(0, wallet?.availableCredits ?? user.creditsRemaining ?? 0);
  const computedRemaining = Math.max(
    0,
    purchasedCredits + bonusCredits - spentCredits - refundedCredits - heldCredits
  );
  const remainingCredits = Math.max(dbAvailable, computedRemaining);
  const totalCredits = Math.max(
    remainingCredits + heldCredits + spentCredits,
    purchasedCredits + bonusCredits - refundedCredits,
    remainingCredits,
  );
  const hasTopUpHistory = purchasedCredits > 0;
  const isFreePlan = !activePlanCode && !hasTopUpHistory;

  const formatDate = (value?: string | Date | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

  const startedDisplay = hasSubscriptionAccess
    ? formatDate(subscription?.startedAt || user.createdAt)
    : formatDate(user.createdAt);

  const statusDisplayMap: Record<string, string> = {
    active: "Active",
    // A paid mandate whose first full charge is booked ahead - where every
    // discounted subscription rests for its ENTIRE first cycle. Missing from
    // this map, it fell through to the default and told a customer who had just
    // paid "No active subscription", directly beneath the plan they had bought.
    scheduled: "Active",
    cancel_scheduled: "Cancel scheduled",
    payment_pending: "Payment pending",
    cancelled: "Cancelled",
    expired: "Expired",
    halted: "Halted",
    refunded: "Refunded",
    refund_pending: "Refund pending",
    inactive: "No active subscription",
  };
  const statusDisplay = statusDisplayMap[subscriptionStatus] || "No active subscription";

  const getPlanDisplayName = () => {
    if (activePlanCode) {
      if (activePlanCode === "sub_month_1" || activePlanCode === "sub_year_1599") return "Discover";
      if (activePlanCode === "sub_month_2" || activePlanCode === "sub_year_3499") return "Core";
      if (activePlanCode === "sub_month_3" || activePlanCode === "sub_year_7499") return "Pro";
      return activePlan?.name || "Subscription";
    }

    if (hasTopUpHistory) {
      return "Top up plan";
    }

    return "Free Plan";
  };

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      const res = await fetch("/api/billing/subscriptions/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert("Error: " + data.error);
      else window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const billingDetails = user.billing?.billingDetails;
  const renewsAt = subscription?.renewsAt;
  const isAboutToExpire = !!(
    hasSubscriptionAccess &&
    renewsAt &&
    new Date(renewsAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
  );

  const getAlertButtonText = () => {
    if (!hasSubscriptionAccess && totalCredits === 0) return "Get started";
    if (hasSubscriptionAccess) return isAboutToExpire ? "Upgrade plan" : "Top up credit";
    return "View plans";
  };

  const getButtonClasses = () => {
    if (hasSubscriptionAccess) {
      if (isAboutToExpire) return "text-[#B20000] border border-[#B20000] hover:bg-red-50";
      return " text-primary-way-100 border border-primary-way-100 hover:bg-primary-way-5";
    }
    if (remainingCredits === 0) return "text-[#B20000] border border-[#B20000] hover:bg-red-50";
    return "text-primary-way-100 hover:bg-primary-way-200 border border-primary-way-100";
  };

  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h2 className="text-base font-medium text-secondary-db-100">Subscription &amp; Plans</h2>
        <p className="text-sm text-secondary-db-80 font-medium">
          Stay on top of your plan and benefits.
        </p>
      </header>

      <div className="px-11 pb-6 pt-5">
        {/* Plan Info */}
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base text-secondary-db-100 flex items-center gap-2">
            Your Plan
            <span className="inline-flex items-center rounded-sm bg-[#E5F5ED] px-2 py-1 text-sm font-medium text-[#01913A] uppercase">
              {getPlanDisplayName()}
            </span>
          </h2>

        </div>

        {/* Alerts / Info */}
        {!hasSubscriptionAccess && totalCredits === 0 ? (
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
                Starter credits are granted after your first eligible plugin sign-in. Your current balance is shown above.
              </p>
            </div>
            <Link
              href="/pricing"
              className={`inline-flex w-fit items-center rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${getButtonClasses()}`}
            >
              {getAlertButtonText()}
            </Link>
          </div>
        ) : remainingCredits === 0 || isAboutToExpire ? (
          <div className="relative mb-6 rounded-md bg-[#FEEAEB] p-4 text-[#B20000] flex border border-red-100">
            <div className="w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src={isAboutToExpire ? "/icons/info-red.svg" : "/icons/red-clock.svg"}
                  alt="Info Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <p className="text-sm font-medium">
                  {isAboutToExpire 
                    ? "Your subscription is about to expire soon. Upgrade now to keep your premium benefits."
                    : "Your credits are over. No worries! Top up more credits to keep exporting, generating, and speeding up your design work."
                  }
                </p>
              </div>
              <Link href="/pricing" className={`text-sm font-medium rounded-md px-4 py-1.5 transition-all duration-200 whitespace-nowrap ${getButtonClasses()}`}>
                  {getAlertButtonText()}
              </Link>
            </div>
          </div>
        ) : isFreePlan ? (
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
                You&apos;re on the Free plan! Enjoy your starter credits and full Waysorted access while you explore the workflow.
              </p>
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
                You&apos;re on the {getPlanDisplayName()} plan! You have full access to all features. Top up more credits if you need to keep your workflow moving fast.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex w-fit items-center rounded-md bg-white px-4 py-2 text-xs font-medium text-primary-way-100 cursor-pointer border border-primary-way-10 shadow-sm hover:bg-primary-way-5 transition-all"
            >
              Top up credit
            </Link>
          </div>
        )}

        {/* Meta Info */}
        <div className="my-6 grid grid-row-1 md:grid-row-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="inline-block space-x-1">
              <span className="text-sm text-secondary-db-100 font-medium">Plan Detail:</span>
              <span className="text-sm font-medium text-secondary-db-80">
                {getPlanDisplayName()} 
                {activePlan && (activePlanCode?.startsWith("sub_month_") || activePlanCode?.startsWith("sub_year_")) 
                  ? ` - ${formatMoney(activePlan.amountPaise, activePlan.currency)}`
                  : !hasSubscriptionAccess && !hasTopUpHistory
                    ? bonusCredits > 0 ? ` - ${bonusCredits} starter credits` : ""
                  : ""}
              </span>
            </div>
            {!isFreePlan && (
              <div className="block space-x-1">
                <span className="text-sm text-secondary-db-100 font-medium">Status:</span>
                <span className="text-sm font-medium text-secondary-db-80">{statusDisplay}</span>
              </div>
            )}
            <div className="block space-x-1">
              <span className="text-sm text-secondary-db-100 font-medium">Started On:</span>
              <span className="text-sm font-regular text-secondary-db-80">{startedDisplay}</span>
            </div>
          </div>

          {!isFreePlan && (
            <div className="rounded-lg bg-primary-way-5 p-4 flex items-center justify-between">
              {/* LHS: Info */}
              <div className="flex flex-col gap-4">
                <span className="text-sm font-semibold text-secondary-db-100">Billing Information</span>
                <div className="flex flex-col  gap-1">
                  <p className="text-xs font-medium text-secondary-db-100">
                  {billingDetails ? `${billingDetails.firstName} ${billingDetails.lastName}` : "Billing details not added"}
                </p>
                
                <p className="text-xs font-medium text-secondary-db-80">
                    {billingDetails?.email || "Add details for future invoices"}
                </p>
                </div>
                
              </div>

              {/* RHS: Buttons in Row */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={onEditBilling}
                  className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-primary-way-100 bg-primary-way-10 cursor-pointer"
                >
                  {billingDetails ? "Change Information" : "Add Information"}
                </button>
                <button 
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex items-center justify-center rounded-md bg-primary-way-10 px-3 py-1.5 text-xs font-medium text-primary-way-100 cursor-pointer hover:bg-primary-way-20 transition-colors"
                >
                  Show History
                </button>
              </div>
            </div>
          )}
        </div>

        <BillingHistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
        />



        {/* Credits */}
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
                credits left
              </span>
            </div>
          </div>

          <Link 
            href="/pricing" 
            className={`inline-flex items-center rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${getButtonClasses()}`}
          >
            {getAlertButtonText()}
          </Link>
        </div>

        {/* Cancel Subscription Accordion */}
        {canCancelSubscription && (
          <div className="mt-8 rounded-md bg-[#FEEAEB] border border-red-100 overflow-hidden">
            <button 
              onClick={() => setIsCancelOpen(!isCancelOpen)}
              className="flex w-full items-center justify-between px-4 py-3 pr-5 text-sm font-semibold text-[#B20000] cursor-pointer transition-colors hover:bg-red-100/50"
            >
              <div className="flex items-center gap-2">
                <Image src="/icons/error-sub.svg" alt="Cancel" width={22} height={22} />
                Cancel Subscription
              </div>
              <Image 
                src="/icons/chevron-down.svg" 
                alt="chevron-down" 
                width={10} 
                height={5} 
                className={`transition-transform duration-200 ${isCancelOpen ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>
            
            {isCancelOpen && (
              <div className="px-4 pb-6 pr-5">
                <p className="text-xs text-secondary-db-80 mb-4 font-medium leading-relaxed">
                  You can cancel your Waysorted subscription from here. Your current plan will remain active until the end of the billing cycle. This action cannot be undone.
                </p>
                <div className="flex justify-end">
                    <button
                    onClick={handleCancelSubscription}
                    className="rounded-md bg-[#CC0E0E] py-1 px-2 text-xs font-medium text-white hover:bg-[#8B0000] cursor-pointer"
                    >
                    Confirm Cancellation
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
