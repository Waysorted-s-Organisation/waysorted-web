export const UTM_ATTRIBUTION_STORAGE_KEY = "waysorted_utm_attribution_v1";
export const UTM_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const MAX_UTM_VALUE_LENGTH = 120;
const MAX_LANDING_PATH_LENGTH = 500;

export type UtmAttribution = {
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath?: string;
  capturedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
  return cleaned || undefined;
}

export function normalizeUtmAttribution(value: unknown): UtmAttribution | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const utmSource = cleanText(input.utmSource, MAX_UTM_VALUE_LENGTH);
  if (!utmSource) return null;

  const rawCapturedAt = cleanText(input.capturedAt, 40);
  const capturedAtMs = rawCapturedAt ? Date.parse(rawCapturedAt) : Number.NaN;
  const capturedAt = Number.isFinite(capturedAtMs)
    ? new Date(capturedAtMs).toISOString()
    : new Date().toISOString();

  return {
    utmSource,
    utmMedium: cleanText(input.utmMedium, MAX_UTM_VALUE_LENGTH),
    utmCampaign: cleanText(input.utmCampaign, MAX_UTM_VALUE_LENGTH),
    utmTerm: cleanText(input.utmTerm, MAX_UTM_VALUE_LENGTH),
    utmContent: cleanText(input.utmContent, MAX_UTM_VALUE_LENGTH),
    landingPath: cleanText(input.landingPath, MAX_LANDING_PATH_LENGTH),
    capturedAt,
  };
}

export function attributionFromSearchParams(
  params: Pick<URLSearchParams, "get">,
  landingPath?: string,
  capturedAt = new Date().toISOString(),
) {
  return normalizeUtmAttribution({
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
    landingPath,
    capturedAt,
  });
}

export function readStoredUtmAttribution(
  storage: StorageLike,
  nowMs = Date.now(),
): UtmAttribution | null {
  try {
    const raw = storage.getItem(UTM_ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const attribution = normalizeUtmAttribution(JSON.parse(raw));
    const capturedAtMs = attribution ? Date.parse(attribution.capturedAt) : Number.NaN;
    if (
      !attribution ||
      !Number.isFinite(capturedAtMs) ||
      capturedAtMs > nowMs + 5 * 60_000 ||
      nowMs - capturedAtMs > UTM_ATTRIBUTION_TTL_MS
    ) {
      storage.removeItem(UTM_ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    return attribution;
  } catch {
    storage.removeItem(UTM_ATTRIBUTION_STORAGE_KEY);
    return null;
  }
}

export function captureCurrentUtmAttribution(): UtmAttribution | null {
  if (typeof window === "undefined") return null;
  const current = attributionFromSearchParams(
    new URLSearchParams(window.location.search),
    `${window.location.pathname}${window.location.search}`,
  );

  try {
    if (current) {
      window.localStorage.setItem(UTM_ATTRIBUTION_STORAGE_KEY, JSON.stringify(current));
      return current;
    }
    return readStoredUtmAttribution(window.localStorage);
  } catch {
    return current;
  }
}
