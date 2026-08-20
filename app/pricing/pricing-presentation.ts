export type PricingDisplayProduct = {
  code: string;
  priceInr: number;
  creditsGranted: number;
  bonusCredits: number;
  billingCycle: "one_time" | "monthly" | "yearly";
};

const PLAN_LEVEL_BY_CODE: Record<string, "discover" | "core" | "pro"> = {
  sub_month_1: "discover",
  sub_year_1599: "discover",
  sub_month_2: "core",
  sub_year_3499: "core",
  sub_month_3: "pro",
  sub_year_7499: "pro",
};

export const PLAN_UI = {
  discover: {
    planName: "Discover",
    description: "Best for individuals getting started with Waysorted.",
    ctaLabel: "Select Plan",
    iconSrc: "/pricingIcons/Discover.png",
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expire, with no monthly reset.",
    ],
  },
  core: {
    planName: "Core",
    description: "Perfect for designers who need full access to tools, credits & ongoing updates.",
    ctaLabel: "Get Started",
    iconSrc: "/pricingIcons/Core.png",
    featured: true,
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for small top-ups",
      "Credits never expire, with no monthly reset.",
    ],
  },
  pro: {
    planName: "Pro",
    description: "Designed for studios and enterprises with more support & credits.",
    ctaLabel: "Select Plan",
    iconSrc: "/pricingIcons/Pro.png",
    features: [
      "Includes all core Waysorted features",
      "Regular updates with ongoing support",
      "Lowest cost for credit top-ups",
      "Credits never expire, with no monthly reset.",
    ],
  },
} as const;

export function getPlanUi(productCode: string) {
  const level = PLAN_LEVEL_BY_CODE[productCode];
  return level ? PLAN_UI[level] : null;
}

export function getCreditPresentation(product: PricingDisplayProduct) {
  const totalCredits = product.creditsGranted + product.bonusCredits;
  const period = product.billingCycle === "yearly"
    ? "year"
    : product.billingCycle === "monthly"
      ? "month"
      : "purchase";

  return {
    creditsLabel: `${totalCredits.toLocaleString("en-US")} credits/${period}`,
    bonusCreditsLabel: product.bonusCredits > 0
      ? `Includes ${product.bonusCredits.toLocaleString("en-US")} bonus credits`
      : undefined,
  };
}

/**
 * Which yearly plan is the same tier as which monthly one.
 *
 * Exported because checkout needs it too: pairing a yearly plan against
 * whichever monthly happened to come first in the catalogue compares Discover's
 * yearly price to Discover's monthly price for one row and to nothing sensible
 * for the rest, so only the first tier ever showed a saving.
 */
export const ANNUAL_PLAN_PAIRS = [
  ["sub_month_1", "sub_year_1599"],
  ["sub_month_2", "sub_year_3499"],
  ["sub_month_3", "sub_year_7499"],
] as const;

/** The monthly plan of the same tier, for a yearly product code. */
export function getMonthlyCounterpartCode(yearlyCode: string): string | null {
  return ANNUAL_PLAN_PAIRS.find(([, yearly]) => yearly === yearlyCode)?.[0] ?? null;
}

export function getMinimumAnnualSavingsPercent(
  monthlyProducts: PricingDisplayProduct[],
  yearlyProducts: PricingDisplayProduct[],
) {
  const pairs = ANNUAL_PLAN_PAIRS;
  const percentages = pairs.flatMap(([monthlyCode, yearlyCode]) => {
    const monthly = monthlyProducts.find((product) => product.code === monthlyCode);
    const yearly = yearlyProducts.find((product) => product.code === yearlyCode);
    if (!monthly || !yearly || monthly.priceInr <= 0) return [];
    return [Math.floor((1 - yearly.priceInr / (monthly.priceInr * 12)) * 100)];
  }).filter((value) => Number.isFinite(value) && value > 0);

  return percentages.length ? Math.min(...percentages) : null;
}
