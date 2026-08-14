import {
  getFeaturePricingRule,
  resolveMaximumImportPricing,
  resolveImportPricing,
  type FileImportPricingOptions,
} from "@/lib/billing/catalog";

const USAGE_CREDIT_MULTIPLIER = 2;

export type UsagePricingRequest = {
  featureCode?: string;
  toolCode?: string;
  sizeBytes?: number;
  selectedOptions?: Record<string, unknown>;
};

export type ResolvedUsagePricing = {
  creditsRequired: number;
  featureCode: string;
  sizeBucket: string | null;
  requiresSubscription: boolean;
  selectedOptions: Record<string, unknown>;
};

function applyUsageCreditMultiplier(credits: number) {
  const normalizedCredits = Number(credits);
  if (!Number.isFinite(normalizedCredits) || normalizedCredits <= 0) {
    return 0;
  }

  return normalizedCredits * USAGE_CREDIT_MULTIPLIER;
}

export function resolveUsageCredits(body: UsagePricingRequest): ResolvedUsagePricing {
  if (!body.featureCode?.trim()) {
    throw new Error("Missing featureCode.");
  }

  const selectedOptions = body.selectedOptions || {};

  if (body.featureCode === "import_file") {
    const sizeBytes = body.sizeBytes;
    if (
      !body.toolCode?.trim() ||
      typeof sizeBytes !== "number" ||
      !Number.isSafeInteger(sizeBytes) ||
      sizeBytes <= 0
    ) {
      throw new Error("Import pricing requires toolCode and sizeBytes.");
    }

    const declaredRule = resolveImportPricing(body.toolCode, sizeBytes, selectedOptions as FileImportPricingOptions);
    const maximumRule = resolveMaximumImportPricing(body.toolCode, selectedOptions as FileImportPricingOptions);
    if (!declaredRule || !maximumRule) {
      throw new Error("Unsupported import size or tool.");
    }

    return {
      // The client cannot choose the price. Hold the maximum permitted amount;
      // the authenticated processor callback settles down to the measured size.
      creditsRequired: applyUsageCreditMultiplier(maximumRule.credits),
      featureCode: maximumRule.featureCode,
      sizeBucket: maximumRule.sizeLabel,
      requiresSubscription: false,
      selectedOptions: {
        ...selectedOptions,
        clientDeclaredSizeBytes: sizeBytes,
        provisionalMaximumHold: true,
      },
    };
  }

  const rule = getFeaturePricingRule(body.featureCode);
  if (!rule) {
    throw new Error("Unknown feature code.");
  }

  return {
    creditsRequired: applyUsageCreditMultiplier(rule.credits),
    featureCode: rule.featureCode,
    sizeBucket: null,
    requiresSubscription: Boolean(rule.requiresSubscription),
    selectedOptions,
  };
}
