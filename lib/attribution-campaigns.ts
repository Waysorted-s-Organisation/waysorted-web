const MAX_NAME_LENGTH = 80;
const MAX_UTM_LENGTH = 120;
const MAX_DESTINATION_LENGTH = 500;

export type AttributionCampaignInput = {
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  destinationPath: string;
};

export function slugifyAttributionValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_UTM_LENGTH);
}

function cleanName(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function cleanUtm(value: unknown, fallback = "") {
  return slugifyAttributionValue(typeof value === "string" ? value : fallback);
}

function cleanDestination(value: unknown) {
  const destination = typeof value === "string" ? value.trim() : "/payment";
  if (
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    destination.length > MAX_DESTINATION_LENGTH ||
    /[\u0000-\u001F\u007F]/.test(destination)
  ) {
    throw new Error("Destination must be a valid Waysorted path beginning with /.");
  }
  return destination;
}

export function normalizeAttributionCampaignInput(value: unknown): AttributionCampaignInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Campaign details are required.");
  }
  const input = value as Record<string, unknown>;
  const name = cleanName(input.name);
  if (name.length < 2) throw new Error("Campaign name must contain at least 2 characters.");

  const utmSource = cleanUtm(input.utmSource, name);
  const utmMedium = cleanUtm(input.utmMedium, "referral");
  const utmCampaign = cleanUtm(input.utmCampaign, "checkout");
  if (!utmSource || !utmMedium || !utmCampaign) {
    throw new Error("Source, medium, and campaign must contain letters or numbers.");
  }

  return {
    name,
    utmSource,
    utmMedium,
    utmCampaign,
    destinationPath: cleanDestination(input.destinationPath),
  };
}

export function buildAttributionCampaignUrl(
  baseUrl: string,
  campaign: Pick<
    AttributionCampaignInput,
    "destinationPath" | "utmSource" | "utmMedium" | "utmCampaign"
  >,
) {
  const base = new URL(baseUrl);
  const url = new URL(campaign.destinationPath, base.origin);
  if (url.origin !== base.origin) throw new Error("Campaign destination must remain on Waysorted.");
  url.searchParams.set("utm_source", campaign.utmSource);
  url.searchParams.set("utm_medium", campaign.utmMedium);
  url.searchParams.set("utm_campaign", campaign.utmCampaign);
  return url.toString();
}
