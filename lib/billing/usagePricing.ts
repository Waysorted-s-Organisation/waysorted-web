import {
  getFeaturePricingRule,
  resolveImportPricing,
  type FileImportPricingOptions,
} from "@/lib/billing/catalog";

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

export function resolveUsageCredits(body: UsagePricingRequest): ResolvedUsagePricing {
  if (!body.featureCode?.trim()) {
    throw new Error("Missing featureCode.");
  }

  const selectedOptions = body.selectedOptions || {};

  if (body.featureCode === "import_file") {
    if (!body.toolCode?.trim() || typeof body.sizeBytes !== "number") {
      throw new Error("Import pricing requires toolCode and sizeBytes.");
    }

    const importRule = resolveImportPricing(
      body.toolCode,
      body.sizeBytes,
      selectedOptions as FileImportPricingOptions,
    );
    if (!importRule) {
      throw new Error("Unsupported import size or tool.");
    }

    return {
      creditsRequired: importRule.credits,
      featureCode: importRule.featureCode,
      sizeBucket: importRule.sizeLabel,
      requiresSubscription: false,
      selectedOptions,
    };
  }

  const rule = getFeaturePricingRule(body.featureCode);
  if (!rule) {
    throw new Error("Unknown feature code.");
  }

  return {
    creditsRequired: rule.credits,
    featureCode: rule.featureCode,
    sizeBucket: null,
    requiresSubscription: Boolean(rule.requiresSubscription),
    selectedOptions,
  };
}
