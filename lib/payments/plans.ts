import type { BillingCycle, PlanId } from "@/types/payment";

export interface PlanVariant {
  amountPaise: number;
  creditsToAdd: number;
  currency: "INR";
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyInr: number;
  yearlyInr: number;
  monthlyCredits: number;
  baseCredits: number;
  bonusCredits: number;
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyInr: 149,
    yearlyInr: 1599,
    monthlyCredits: 225,
    baseCredits: 200,
    bonusCredits: 25,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyInr: 349,
    yearlyInr: 3499,
    monthlyCredits: 550,
    baseCredits: 500,
    bonusCredits: 50,
  },
  scale: {
    id: "scale",
    name: "Scale",
    monthlyInr: 749,
    yearlyInr: 7499,
    monthlyCredits: 1300,
    baseCredits: 1200,
    bonusCredits: 100,
  },
};

export function isPlanId(value: string): value is PlanId {
  return value === "starter" || value === "pro" || value === "scale";
}

export function isBillingCycle(value: string): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function getPlanVariant(planId: PlanId, billing: BillingCycle): PlanVariant {
  const plan = PLAN_CATALOG[planId];
  if (billing === "monthly") {
    return {
      amountPaise: plan.monthlyInr * 100,
      creditsToAdd: plan.monthlyCredits,
      currency: "INR",
    };
  }

  return {
    amountPaise: plan.yearlyInr * 100,
    creditsToAdd: plan.monthlyCredits * 12,
    currency: "INR",
  };
}
