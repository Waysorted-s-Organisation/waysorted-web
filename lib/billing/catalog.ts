import type { BillingEligibility, BillingProductKind, IBillingProduct } from "@/models/billingProduct";

export type CatalogProduct = Omit<
  IBillingProduct,
  "createdAt" | "updatedAt" | "providerPlanId" | "metadata"
> & {
  providerPlanId?: string | null;
  metadata?: Record<string, unknown>;
};

export type FeaturePricingRule = {
  featureCode: string;
  credits: number;
  description: string;
  requiresSubscription?: boolean;
};

export type FileImportPricingRule = {
  featureCode: string;
  sizeLabel: string;
  maxBytes: number;
  credits: number;
};

export const BILLING_PRICING_VERSION = "v1";

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    code: "starter_149",
    name: "Starter 149",
    kind: "starter",
    eligibility: "new_user",
    priceInr: 149,
    amountPaise: 14900,
    creditsGranted: 200,
    bonusCredits: 25,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "starter_349",
    name: "Starter 349",
    kind: "starter",
    eligibility: "new_user",
    priceInr: 349,
    amountPaise: 34900,
    creditsGranted: 500,
    bonusCredits: 50,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "starter_749",
    name: "Starter 749",
    kind: "starter",
    eligibility: "new_user",
    priceInr: 749,
    amountPaise: 74900,
    creditsGranted: 1200,
    bonusCredits: 100,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "topup_sub_50",
    name: "Subscribed Top-up 50",
    kind: "topup",
    eligibility: "subscriber",
    priceInr: 50,
    amountPaise: 5000,
    creditsGranted: 40,
    bonusCredits: 0,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "topup_sub_100",
    name: "Subscribed Top-up 100",
    kind: "topup",
    eligibility: "subscriber",
    priceInr: 100,
    amountPaise: 10000,
    creditsGranted: 90,
    bonusCredits: 0,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "topup_sub_120",
    name: "Subscribed Top-up 120",
    kind: "topup",
    eligibility: "subscriber",
    priceInr: 120,
    amountPaise: 12000,
    creditsGranted: 110,
    bonusCredits: 0,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "topup_std_50",
    name: "Standard Top-up 50",
    kind: "topup",
    eligibility: "standard",
    priceInr: 50,
    amountPaise: 5000,
    creditsGranted: 35,
    bonusCredits: 0,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "topup_std_100",
    name: "Standard Top-up 100",
    kind: "topup",
    eligibility: "standard",
    priceInr: 100,
    amountPaise: 10000,
    creditsGranted: 75,
    bonusCredits: 0,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "topup_std_120",
    name: "Standard Top-up 120",
    kind: "topup",
    eligibility: "standard",
    priceInr: 120,
    amountPaise: 12000,
    creditsGranted: 100,
    bonusCredits: 0,
    billingCycle: "one_time",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_year_1599",
    name: "Yearly 1599",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 1599,
    amountPaise: 159900,
    creditsGranted: 2400,
    bonusCredits: 0,
    billingCycle: "yearly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_year_3499",
    name: "Yearly 3499",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 3499,
    amountPaise: 349900,
    creditsGranted: 6000,
    bonusCredits: 0,
    billingCycle: "yearly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_year_7499",
    name: "Yearly 7499",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 7499,
    amountPaise: 749900,
    creditsGranted: 14400,
    bonusCredits: 0,
    billingCycle: "yearly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
];

export const FEATURE_PRICING: FeaturePricingRule[] = [
  { featureCode: "dpi_150", credits: 2, description: "150 DPI export" },
  { featureCode: "dpi_300", credits: 5, description: "300 DPI export" },
  { featureCode: "cmyk", credits: 2, description: "CMYK export" },
  { featureCode: "resolution_low", credits: 0, description: "Low resolution" },
  { featureCode: "resolution_medium", credits: 2, description: "Medium resolution" },
  { featureCode: "resolution_high", credits: 5, description: "High resolution" },
  { featureCode: "bleed", credits: 2, description: "Bleed option" },
  { featureCode: "preset_standard", credits: 0, description: "Standard preset" },
  {
    featureCode: "preset_customizable",
    credits: 0,
    description: "Customizable preset",
    requiresSubscription: true,
  },
];

export const AI_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_ai", sizeLabel: "small", maxBytes: 5 * 1024 * 1024, credits: 15 },
  { featureCode: "import_ai", sizeLabel: "medium", maxBytes: 25 * 1024 * 1024, credits: 20 },
  { featureCode: "import_ai", sizeLabel: "large", maxBytes: 75 * 1024 * 1024, credits: 30 },
];

export const EPS_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_eps", sizeLabel: "small", maxBytes: 8 * 1024 * 1024, credits: 15 },
  { featureCode: "import_eps", sizeLabel: "medium", maxBytes: 30 * 1024 * 1024, credits: 22 },
  { featureCode: "import_eps", sizeLabel: "large", maxBytes: 100 * 1024 * 1024, credits: 35 },
];

export const PSD_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_psd", sizeLabel: "small", maxBytes: 10 * 1024 * 1024, credits: 15 },
  { featureCode: "import_psd", sizeLabel: "medium", maxBytes: 50 * 1024 * 1024, credits: 25 },
  { featureCode: "import_psd", sizeLabel: "large", maxBytes: 200 * 1024 * 1024, credits: 40 },
];

export function getCatalogProduct(code: string) {
  return CATALOG_PRODUCTS.find((product) => product.code === code) || null;
}

export function isSubscriptionActive(
  status: string | null | undefined,
  renewsAt?: Date | null,
) {
  if (status === "active" || status === "cancel_scheduled") {
    return !renewsAt || renewsAt.getTime() >= Date.now();
  }
  return false;
}

export function getVisibleCatalog(params: {
  isNewUser: boolean;
  hasActiveSubscription: boolean;
}) {
  const { isNewUser, hasActiveSubscription } = params;
  return CATALOG_PRODUCTS.filter((product) => {
    if (!product.active) return false;
    if (product.kind === "starter") return isNewUser;
    if (product.kind === "topup") {
      return hasActiveSubscription
        ? product.eligibility === "subscriber"
        : product.eligibility === "standard";
    }
    return true;
  });
}

export function getFeaturePricingRule(featureCode: string) {
  return FEATURE_PRICING.find((rule) => rule.featureCode === featureCode) || null;
}

export function resolveImportPricing(toolCode: string, sizeBytes: number) {
  const normalizedTool = toolCode.trim().toLowerCase();
  const table =
    normalizedTool === "ai"
      ? AI_IMPORT_PRICING
      : normalizedTool === "eps"
        ? EPS_IMPORT_PRICING
        : normalizedTool === "psd"
          ? PSD_IMPORT_PRICING
          : null;

  if (!table) return null;

  return table.find((rule) => sizeBytes <= rule.maxBytes) || null;
}

export function getProductEligibilityLabel(eligibility: BillingEligibility) {
  switch (eligibility) {
    case "new_user":
      return "new_user_only";
    case "subscriber":
      return "active_subscription_required";
    case "standard":
      return "non_subscriber";
    default:
      return "everyone";
  }
}

export function inferPurchaseKind(kind: BillingProductKind) {
  return kind;
}
