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

export type FileImportPricingOptions = {
  importMode?: unknown;
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
    active: false,
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
    active: false,
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
    active: false,
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
    code: "sub_month_1",
    name: "Monthly 1",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 149,
    amountPaise: 14900,
    creditsGranted: 150,
    bonusCredits: 0,
    billingCycle: "monthly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_month_2",
    name: "Monthly 2",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 349,
    amountPaise: 34900,
    creditsGranted: 550,
    bonusCredits: 0,
    billingCycle: "monthly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_month_3",
    name: "Monthly 3",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 749,
    amountPaise: 74900,
    creditsGranted: 1500,
    bonusCredits: 0,
    billingCycle: "monthly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_year_1599",
    name: "Yearly 1",
    kind: "subscription",
    eligibility: "everyone",
    priceInr: 1499,
    amountPaise: 149900,
    creditsGranted: 2400,
    bonusCredits: 0,
    billingCycle: "yearly",
    currency: "INR",
    active: true,
    version: BILLING_PRICING_VERSION,
  },
  {
    code: "sub_year_3499",
    name: "Yearly 2",
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
    name: "Yearly 3",
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
  { featureCode: "frame_generation", credits: 5, description: "Frame generation" },
  { featureCode: "bleed", credits: 2.5, description: "Bleed option" },
  {
    featureCode: "ai_contrast",
    credits: 2.5,
    description: "Enhance contrast with AI",
    requiresSubscription: true,
  },
  { featureCode: "dpi_150", credits: 2, description: "150 DPI export" },
  { featureCode: "dpi_300", credits: 5, description: "300 DPI export" },
  { featureCode: "cmyk", credits: 2, description: "CMYK export" },
  { featureCode: "resolution_low", credits: 0, description: "Low resolution" },
  { featureCode: "resolution_medium", credits: 2, description: "Medium resolution" },
  { featureCode: "resolution_high", credits: 5, description: "High resolution" },
  {
    featureCode: "preset_standard",
    credits: 0,
    description: "Standard preset",
  },
  {
    featureCode: "preset_customizable",
    credits: 0,
    description: "Customizable preset",
    requiresSubscription: true,
  },
  {
    featureCode: "comment_summarize_single",
    // Usage pricing applies the global 2x multiplier: 2.5 -> 5 credits.
    credits: 2.5,
    description: "Analyze one comment (Summary and Actionable)",
  },
  {
    featureCode: "comment_summarize_batch",
    // A batch is always 20 credits, independent of selected comment count.
    credits: 10,
    description: "Summarize selected comments",
  },
  {
    featureCode: "comment_page_scope",
    // Page scopes cost 5 * 2 = 10 credits and require a paid plan.
    credits: 5,
    description: "Process one Comment Summarizer Page scope",
    requiresSubscription: true,
  },
  {
    featureCode: "comment_section_scope_paid",
    // Paid Section runs cost 2.5 * 2 = 5 credits.
    credits: 2.5,
    description: "Process one paid Comment Summarizer Section scope",
    requiresSubscription: true,
  },
  {
    featureCode: "comment_section_scope_free",
    // Free Section runs cost 5 * 2 = 10 credits and remain limited in-plugin.
    credits: 5,
    description: "Process one free Comment Summarizer Section scope",
  },
  {
    featureCode: "icon_create_component",
    // Applies 2x multiplier: 1 * 2 = 2 credits
    credits: 1,
    description: "Create Component for Icon Library",
  },
  {
    featureCode: "icon_export_code",
    // Applies 2x multiplier: 1.5 * 2 = 3 credits
    credits: 1.5,
    description: "Export Code for Icon Library",
  },
  {
    featureCode: "icon_create_component_export_code",
    // Applies 2x multiplier: 2 * 2 = 4 credits
    credits: 2,
    description: "Create Component and Export Code for Icon Library",
  },
];

export const AI_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_ai", sizeLabel: "small", maxBytes: 5 * 1024 * 1024, credits: 9 },
  { featureCode: "import_ai", sizeLabel: "medium", maxBytes: 25 * 1024 * 1024, credits: 12.5 },
  { featureCode: "import_ai", sizeLabel: "large", maxBytes: 75 * 1024 * 1024, credits: 17.5 },
];

export const EPS_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_eps", sizeLabel: "small", maxBytes: 8 * 1024 * 1024, credits: 9 },
  { featureCode: "import_eps", sizeLabel: "medium", maxBytes: 30 * 1024 * 1024, credits: 14 },
  { featureCode: "import_eps", sizeLabel: "large", maxBytes: 100 * 1024 * 1024, credits: 20 },
];

export const PSD_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_psd", sizeLabel: "small", maxBytes: 10 * 1024 * 1024, credits: 10 },
  { featureCode: "import_psd", sizeLabel: "medium", maxBytes: 50 * 1024 * 1024, credits: 15 },
  { featureCode: "import_psd", sizeLabel: "large", maxBytes: 200 * 1024 * 1024, credits: 22.5 },
];

export const PDF_EDITABLE_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_pdf_editable", sizeLabel: "small", maxBytes: 5 * 1024 * 1024, credits: 9 },
  { featureCode: "import_pdf_editable", sizeLabel: "medium", maxBytes: 25 * 1024 * 1024, credits: 12.5 },
  { featureCode: "import_pdf_editable", sizeLabel: "large", maxBytes: 75 * 1024 * 1024, credits: 17.5 },
];

export const PDF_IMAGE_IMPORT_PRICING: FileImportPricingRule[] = [
  { featureCode: "import_pdf_image", sizeLabel: "small", maxBytes: 5 * 1024 * 1024, credits: 9 },
  { featureCode: "import_pdf_image", sizeLabel: "medium", maxBytes: 25 * 1024 * 1024, credits: 12.5 },
  { featureCode: "import_pdf_image", sizeLabel: "large", maxBytes: 75 * 1024 * 1024, credits: 17.5 },
];

export function getCatalogProduct(code: string) {
  return CATALOG_PRODUCTS.find((product) => product.code === code) || null;
}

export function isSubscriptionActive(
  status: string | null | undefined,
  renewsAt?: Date | null,
) {
  // "scheduled" is a paid, authorised mandate whose first charge is booked for a
  // future date - which is exactly what a discounted first cycle looks like for
  // its whole first period. Excluding it showed a paying customer as having no
  // subscription, withheld their capabilities and swapped their top-up pricing.
  if (status === "active" || status === "cancel_scheduled" || status === "scheduled") {
    return Boolean(renewsAt) && renewsAt!.getTime() >= Date.now();
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

export function resolveImportPricing(
  toolCode: string,
  sizeBytes: number,
  selectedOptions: FileImportPricingOptions = {},
) {
  const normalizedTool = toolCode.trim().toLowerCase();
  const normalizedPdfImportMode =
    normalizedTool === "pdf" &&
    typeof selectedOptions?.importMode === "string" &&
    selectedOptions.importMode.trim().toLowerCase() === "image"
      ? "image"
      : "editable";
  const table =
    normalizedTool === "ai"
      ? AI_IMPORT_PRICING
      : normalizedTool === "eps"
        ? EPS_IMPORT_PRICING
        : normalizedTool === "psd"
          ? PSD_IMPORT_PRICING
          : normalizedTool === "pdf"
            ? normalizedPdfImportMode === "image"
              ? PDF_IMAGE_IMPORT_PRICING
              : PDF_EDITABLE_IMPORT_PRICING
          : null;

  if (!table) return null;

  return table.find((rule) => sizeBytes <= rule.maxBytes) || null;
}

export function resolveMaximumImportPricing(
  toolCode: string,
  selectedOptions: FileImportPricingOptions = {},
) {
  const normalizedTool = toolCode.trim().toLowerCase();
  const normalizedPdfImportMode =
    normalizedTool === "pdf" &&
    typeof selectedOptions.importMode === "string" &&
    selectedOptions.importMode.trim().toLowerCase() === "image"
      ? "image"
      : "editable";
  const table = normalizedTool === "ai"
    ? AI_IMPORT_PRICING
    : normalizedTool === "eps"
      ? EPS_IMPORT_PRICING
      : normalizedTool === "psd"
        ? PSD_IMPORT_PRICING
        : normalizedTool === "pdf"
          ? normalizedPdfImportMode === "image"
            ? PDF_IMAGE_IMPORT_PRICING
            : PDF_EDITABLE_IMPORT_PRICING
          : null;
  return table?.[table.length - 1] || null;
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
