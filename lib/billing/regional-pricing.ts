import type { NextRequest } from "next/server";
import { CATALOG_PRODUCTS, type CatalogProduct } from "@/lib/billing/catalog";
import { minimumChargeSubunits, minorUnitMultiplier } from "@/lib/billing/money";

export type PricingTier = "tier_1" | "tier_2" | "tier_3";
export const LEGACY_PRICING_COUNTRY_COOKIE = "ws_pricing_country";

/**
 * Country used when no trusted geo signal is available.
 *
 * This MUST stay conservative for the business, not for the wallet: Waysorted bills through an
 * INR-first Razorpay account, so falling back to a foreign currency both overcharges the majority
 * of real visitors and can hand Razorpay a currency the account cannot settle. Deployments that
 * genuinely serve a non-Indian majority can override it.
 */
export const DEFAULT_PRICING_COUNTRY_FALLBACK = "IN";

export function getDefaultPricingCountry(override?: string | null) {
  const configured = (override ?? process.env.BILLING_DEFAULT_PRICING_COUNTRY)?.trim().toUpperCase();
  return configured && /^[A-Z]{2}$/.test(configured) ? configured : DEFAULT_PRICING_COUNTRY_FALLBACK;
}

/**
 * Header that carries an edge-computed country for this deployment.
 *
 * Only the platform's own header may be trusted: anything a client can set (notably `cf-ipcountry`
 * when the app is NOT actually behind Cloudflare) would let a visitor pick their own price tier.
 * Non-Vercel deployments must name their trusted header explicitly via BILLING_TRUSTED_GEO_HEADER
 * and guarantee at the proxy that the header is stripped from inbound requests and re-set by the edge.
 */
export const DEFAULT_TRUSTED_GEO_HEADER = "x-vercel-ip-country";

export function getTrustedGeoHeaderName(override?: string | null) {
  const configured = (override ?? process.env.BILLING_TRUSTED_GEO_HEADER)?.trim().toLowerCase();
  return configured || DEFAULT_TRUSTED_GEO_HEADER;
}

export type PricingContext = {
  country: string;
  countryName: string;
  tier: PricingTier;
  currency: string;
  riskFlags: string[];
  locked: boolean;
  source: "request" | "existing_lock" | "default";
};

export type RegionalPricedProduct = CatalogProduct & {
  basePriceInr: number;
  displayAmount: number;
  pricingCountry: string;
  pricingCountryName: string;
  pricingTier: PricingTier;
  pricingRiskFlags: string[];
};

const TIER_RANK: Record<PricingTier, number> = {
  tier_1: 3,
  tier_2: 2,
  tier_3: 1,
};

const TIER_1_COUNTRIES = new Set([
  "US",
  "CA",
  "GB",
  "DE",
  "FR",
  "NL",
  "AU",
  "NZ",
  "SG",
  "AE",
  "CH",
  "DK",
  "FI",
  "IS",
  "NO",
  "SE",
  "AT",
  "BE",
  "IE",
  "LU",
  "JP",
  "KR",
  "HK",
  "QA",
  "KW",
]);

const EASTERN_EUROPE = [
  "AL",
  "BA",
  "BG",
  "BY",
  "CZ",
  "EE",
  "HR",
  "HU",
  "LT",
  "LV",
  "MD",
  "ME",
  "MK",
  "PL",
  "RO",
  "RS",
  "RU",
  "SI",
  "SK",
  "UA",
];

const TIER_2_COUNTRIES = new Set([
  ...EASTERN_EUROPE,
  "MY",
  "TH",
  "VN",
  "MX",
  "BR",
  "TR",
  "ZA",
  "PH",
  "ID",
  "CO",
  "CL",
]);

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  AU: "Australia",
  NZ: "New Zealand",
  SG: "Singapore",
  AE: "United Arab Emirates",
  CH: "Switzerland",
  DK: "Denmark",
  FI: "Finland",
  IS: "Iceland",
  NO: "Norway",
  SE: "Sweden",
  AT: "Austria",
  BE: "Belgium",
  IE: "Ireland",
  LU: "Luxembourg",
  JP: "Japan",
  KR: "South Korea",
  HK: "Hong Kong",
  QA: "Qatar",
  KW: "Kuwait",
  IN: "India",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  MX: "Mexico",
  BR: "Brazil",
  TR: "Turkey",
  ZA: "South Africa",
  PH: "Philippines",
  ID: "Indonesia",
  CO: "Colombia",
  CL: "Chile",
  AL: "Albania",
  BA: "Bosnia and Herzegovina",
  BG: "Bulgaria",
  BY: "Belarus",
  CZ: "Czechia",
  EE: "Estonia",
  HR: "Croatia",
  HU: "Hungary",
  LT: "Lithuania",
  LV: "Latvia",
  MD: "Moldova",
  ME: "Montenegro",
  MK: "North Macedonia",
  PL: "Poland",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  SI: "Slovenia",
  SK: "Slovakia",
  UA: "Ukraine",
};

const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  NL: "EUR",
  AU: "AUD",
  NZ: "NZD",
  SG: "SGD",
  AE: "AED",
  CH: "CHF",
  DK: "DKK",
  FI: "EUR",
  IS: "EUR",
  NO: "NOK",
  SE: "SEK",
  AT: "EUR",
  BE: "EUR",
  IE: "EUR",
  LU: "EUR",
  JP: "JPY",
  KR: "KRW",
  HK: "HKD",
  QA: "QAR",
  KW: "KWD",
  MY: "MYR",
  TH: "THB",
  VN: "VND",
  MX: "MXN",
  BR: "BRL",
  TR: "TRY",
  ZA: "ZAR",
  PH: "PHP",
  ID: "IDR",
  CO: "COP",
  CL: "CLP",
  IN: "INR",
  AL: "ALL",
  BA: "BAM",
  BG: "BGN",
  BY: "BYN",
  CZ: "CZK",
  EE: "EUR",
  HR: "EUR",
  HU: "HUF",
  LT: "EUR",
  LV: "EUR",
  MD: "MDL",
  ME: "EUR",
  MK: "MKD",
  PL: "PLN",
  RO: "RON",
  RS: "RSD",
  RU: "RUB",
  SI: "EUR",
  SK: "EUR",
  UA: "UAH",
};

const CURRENCY_PER_INR: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  CAD: 0.016,
  GBP: 0.0095,
  EUR: 0.011,
  AUD: 0.018,
  NZD: 0.02,
  SGD: 0.016,
  AED: 0.044,
  CHF: 0.011,
  DKK: 0.082,
  NOK: 0.13,
  SEK: 0.12,
  HKD: 0.094,
  QAR: 0.044,
  KWD: 0.0037,
  JPY: 1.86,
  KRW: 16.6,
  MYR: 0.057,
  THB: 0.44,
  VND: 306,
  MXN: 0.21,
  BRL: 0.067,
  TRY: 0.39,
  ZAR: 0.22,
  PHP: 0.68,
  IDR: 194,
  COP: 47.5,
  CLP: 11.4,
  ALL: 1.04,
  BAM: 0.021,
  BGN: 0.022,
  BYN: 0.039,
  CZK: 0.26,
  HUF: 4.3,
  MDL: 0.21,
  MKD: 0.68,
  PLN: 0.044,
  RON: 0.055,
  RSD: 1.29,
  RUB: 0.96,
  UAH: 0.5,
};

function catalogBasePrice(code: string) {
  const product = CATALOG_PRODUCTS.find((item) => item.code === code);
  if (!product) throw new Error(`Missing billing catalog product ${code}.`);
  return product.priceInr;
}

const PRICE_MATRIX_INR: Record<string, Record<PricingTier, number>> = {
  starter_149: { tier_1: 499, tier_2: 249, tier_3: catalogBasePrice("starter_149") },
  starter_349: { tier_1: 999, tier_2: 549, tier_3: catalogBasePrice("starter_349") },
  starter_749: { tier_1: 1999, tier_2: 1099, tier_3: catalogBasePrice("starter_749") },
  sub_month_1: { tier_1: 499, tier_2: 249, tier_3: catalogBasePrice("sub_month_1") },
  sub_month_2: { tier_1: 999, tier_2: 549, tier_3: catalogBasePrice("sub_month_2") },
  sub_month_3: { tier_1: 1999, tier_2: 1099, tier_3: catalogBasePrice("sub_month_3") },
  sub_year_1599: { tier_1: 4999, tier_2: 2499, tier_3: catalogBasePrice("sub_year_1599") },
  sub_year_3499: { tier_1: 9999, tier_2: 5499, tier_3: catalogBasePrice("sub_year_3499") },
  sub_year_7499: { tier_1: 19999, tier_2: 10999, tier_3: catalogBasePrice("sub_year_7499") },
  topup_sub_50: { tier_1: 199, tier_2: 99, tier_3: catalogBasePrice("topup_sub_50") },
  topup_std_50: { tier_1: 199, tier_2: 99, tier_3: catalogBasePrice("topup_std_50") },
  topup_sub_100: { tier_1: 399, tier_2: 199, tier_3: catalogBasePrice("topup_sub_100") },
  topup_std_100: { tier_1: 399, tier_2: 199, tier_3: catalogBasePrice("topup_std_100") },
  topup_sub_120: { tier_1: 499, tier_2: 249, tier_3: catalogBasePrice("topup_sub_120") },
  topup_std_120: { tier_1: 499, tier_2: 249, tier_3: catalogBasePrice("topup_std_120") },
};

for (const product of CATALOG_PRODUCTS.filter((item) => item.active)) {
  const matrixPrice = PRICE_MATRIX_INR[product.code]?.tier_3;
  if (matrixPrice === undefined || matrixPrice !== product.priceInr) {
    throw new Error(
      `Billing price configuration mismatch for ${product.code}: catalog=${product.priceInr}, tier_3=${matrixPrice ?? "missing"}.`,
    );
  }
}

export function getCountryTier(country: string): PricingTier {
  const code = normalizeCountry(country);
  if (TIER_1_COUNTRIES.has(code)) return "tier_1";
  if (TIER_2_COUNTRIES.has(code)) return "tier_2";
  return "tier_3";
}

/**
 * Parse an ISO-3166 alpha-2 code, returning null when the input is not one.
 *
 * Free text ("India", "United States") is NOT guessable and must not be coerced: the previous
 * behaviour silently mapped every unparseable value to "US", which promoted Indian customers to
 * tier_1 USD pricing and saturated the country-mismatch risk flags.
 */
export function parseCountryCode(country?: string | null): string | null {
  const code = (country || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function normalizeCountry(country?: string | null) {
  return parseCountryCode(country) ?? getDefaultPricingCountry();
}

export function getCountryName(country: string) {
  const code = normalizeCountry(country);
  return COUNTRY_NAMES[code] || code;
}

export function getCurrencyForCountry(country: string) {
  const code = normalizeCountry(country);
  return COUNTRY_CURRENCY[code] || "INR";
}

export function getTierRank(tier: PricingTier) {
  return TIER_RANK[tier];
}

export function getTrustedPricingCountry(
  headers: Pick<Headers, "get">,
  options: {
    nodeEnv?: string;
    developmentOverride?: string | null;
    trustedHeader?: string | null;
  } = {},
) {
  const trustedHeader = getTrustedGeoHeaderName(options.trustedHeader);
  const edgeCountry = parseCountryCode(headers.get(trustedHeader));
  if (edgeCountry) {
    return edgeCountry;
  }

  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv !== "production") {
    const developmentCountry = (options.developmentOverride ?? process.env.DEV_PRICING_COUNTRY)
      ?.trim()
      .toUpperCase();
    if (developmentCountry && /^[A-Z]{2}$/.test(developmentCountry)) {
      return developmentCountry;
    }
  }

  return null;
}

export function getSafestObservedCountry(
  trustedRequestCountry?: string | null,
  historicalAuthCountry?: string | null,
) {
  if (!trustedRequestCountry) return null;

  const trustedCountry = normalizeCountry(trustedRequestCountry);
  if (!historicalAuthCountry) return trustedCountry;

  const authCountry = normalizeCountry(historicalAuthCountry);
  return getTierRank(getCountryTier(authCountry)) > getTierRank(getCountryTier(trustedCountry))
    ? authCountry
    : trustedCountry;
}

export function getPricingCountryMismatchRiskFlags(input: {
  authCountry?: string | null;
  trustedRequestCountry?: string | null;
  declaredBillingCountry?: string | null;
  lockedPricingCountry?: string | null;
}) {
  const riskFlags: string[] = [];
  if (
    input.authCountry &&
    input.trustedRequestCountry &&
    normalizeCountry(input.authCountry) !== normalizeCountry(input.trustedRequestCountry)
  ) {
    riskFlags.push("auth_country_differs_from_checkout_country");
  }
  if (
    input.declaredBillingCountry &&
    input.lockedPricingCountry &&
    normalizeCountry(input.declaredBillingCountry) !== normalizeCountry(input.lockedPricingCountry)
  ) {
    riskFlags.push("billing_country_differs_from_pricing_country");
  }
  return riskFlags;
}

export function getCountryFromRequest(request?: NextRequest | null) {
  if (!request) return null;
  return getTrustedPricingCountry(request.headers);
}

export function withPricingRiskFlags(pricing: PricingContext, riskFlags: string[]): PricingContext {
  return {
    ...pricing,
    riskFlags: Array.from(new Set([...pricing.riskFlags, ...riskFlags])),
  };
}

export function createPricingContext(input: {
  detectedCountry?: string | null;
  lockedCountry?: string | null;
  lockedTier?: string | null;
  lockedCurrency?: string | null;
}): PricingContext {
  const detectedCountry = input.detectedCountry ? normalizeCountry(input.detectedCountry) : null;
  const detectedTier = detectedCountry ? getCountryTier(detectedCountry) : null;
  const lockedCountry = input.lockedCountry ? normalizeCountry(input.lockedCountry) : null;
  const lockedTier = input.lockedTier as PricingTier | null;
  const riskFlags: string[] = [];

  if (!detectedCountry && !lockedCountry) {
    // No trusted geo signal. Bill in the deployment's home currency rather than promoting the
    // visitor to the most expensive tier in a currency the Razorpay account may not settle.
    // `source: "default"` marks this context as NOT lockable - see shouldPersistPricingLock.
    const fallbackCountry = getDefaultPricingCountry();
    return {
      country: fallbackCountry,
      countryName: getCountryName(fallbackCountry),
      tier: getCountryTier(fallbackCountry),
      currency: getCurrencyForCountry(fallbackCountry),
      riskFlags: ["missing_country_default_pricing"],
      locked: false,
      source: "default",
    };
  }

  if (lockedCountry && lockedTier) {
    if (detectedCountry && detectedCountry !== lockedCountry) {
      const detectedRank = detectedTier ? getTierRank(detectedTier) : 0;
      const lockedRank = getTierRank(lockedTier);
      if (detectedRank < lockedRank) riskFlags.push("country_changed_to_cheaper_tier");
      if (detectedRank > lockedRank) riskFlags.push("country_changed_to_higher_tier");
      riskFlags.push("country_changed_after_lock");
    }

    return {
      country: lockedCountry,
      countryName: getCountryName(lockedCountry),
      tier: lockedTier,
      currency: input.lockedCurrency || getCurrencyForCountry(lockedCountry),
      riskFlags,
      locked: true,
      source: "existing_lock",
    };
  }

  const country = detectedCountry || "US";
  const tier = getCountryTier(country);
  return {
    country,
    countryName: getCountryName(country),
    tier,
    currency: getCurrencyForCountry(country),
    riskFlags,
    locked: false,
    source: "request",
  };
}

function roundDisplayAmount(value: number, currency: string) {
  if (currency === "INR") return Math.round(value);
  if (value >= 100) return Math.round(value);
  if (value >= 20) return Math.round(value * 2) / 2;
  return Math.round(value * 100) / 100;
}

export function convertInrToCurrencyAmount(inrAmount: number, currency: string) {
  const rate = CURRENCY_PER_INR[currency] || 1;
  return roundDisplayAmount(inrAmount * rate, currency);
}

export function toSubunits(amount: number, currency: string) {
  return Math.max(minimumChargeSubunits(currency), Math.round(amount * minorUnitMultiplier(currency)));
}

export function getTierPriceInr(productCode: string, tier: PricingTier, fallbackInr: number) {
  return PRICE_MATRIX_INR[productCode]?.[tier] ?? fallbackInr;
}

export function applyRegionalPrice<T extends CatalogProduct>(
  product: T,
  pricing: PricingContext,
): T & RegionalPricedProduct {
  const basePriceInr = getTierPriceInr(product.code, pricing.tier, product.priceInr);
  const displayAmount = convertInrToCurrencyAmount(basePriceInr, pricing.currency);
  const amountPaise = toSubunits(displayAmount, pricing.currency);

  return {
    ...product,
    priceInr: basePriceInr,
    amountPaise,
    currency: pricing.currency,
    basePriceInr,
    displayAmount,
    pricingCountry: pricing.country,
    pricingCountryName: pricing.countryName,
    pricingTier: pricing.tier,
    pricingRiskFlags: pricing.riskFlags,
  };
}
