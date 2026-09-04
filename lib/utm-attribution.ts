export const UTM_ATTRIBUTION_STORAGE_KEY = "waysorted_utm_attribution_v1";
export const UTM_ATTRIBUTION_VISITOR_KEY = "waysorted_attribution_visitor_v1";
export const UTM_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const MAX_UTM_VALUE_LENGTH = 120;
const MAX_LANDING_PATH_LENGTH = 500;
const UTM_QUERY_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type UtmAttribution = {
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath?: string;
  visitorId?: string;
  capturedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type AttributionOpenPayload = {
  eventId: string;
  visitorId: string;
  attribution: UtmAttribution;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    ...(typeof input.visitorId === "string" && UUID_PATTERN.test(input.visitorId)
      ? { visitorId: input.visitorId }
      : {}),
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

export function attributionLandingPath(
  pathname: string,
  params: Pick<URLSearchParams, "get">,
) {
  const tracked = new URLSearchParams();
  for (const key of UTM_QUERY_KEYS) {
    const value = params.get(key);
    if (value) tracked.set(key, value);
  }
  const query = tracked.toString();
  return `${pathname}${query ? `?${query}` : ""}`.slice(0, MAX_LANDING_PATH_LENGTH);
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
    const attribution = current || readStoredUtmAttribution(window.localStorage);
    if (!attribution) return null;
    const visitorId = getOrCreateAttributionVisitorId(
      window.localStorage,
      () => window.crypto.randomUUID(),
    );
    const enriched = visitorId ? { ...attribution, visitorId } : attribution;
    if (current) {
      window.localStorage.setItem(UTM_ATTRIBUTION_STORAGE_KEY, JSON.stringify(enriched));
    }
    return enriched;
  } catch {
    return current;
  }
}

export function getOrCreateAttributionVisitorId(
  storage: StorageLike,
  createId: () => string,
) {
  const existing = storage.getItem(UTM_ATTRIBUTION_VISITOR_KEY);
  if (existing && UUID_PATTERN.test(existing)) return existing;
  const visitorId = createId();
  if (!UUID_PATTERN.test(visitorId)) return null;
  storage.setItem(UTM_ATTRIBUTION_VISITOR_KEY, visitorId);
  return visitorId;
}

export function buildAttributionOpenPayload(
  attribution: UtmAttribution,
  visitorId: string,
  pageLoadId: string,
): AttributionOpenPayload | null {
  const normalized = normalizeUtmAttribution(attribution);
  const safePageLoadId = String(pageLoadId).replace(/[^0-9]/g, "").slice(0, 20);
  if (!normalized || !UUID_PATTERN.test(visitorId) || !safePageLoadId) return null;
  return {
    eventId: `${visitorId}:${safePageLoadId}`,
    visitorId,
    attribution: { ...normalized, visitorId },
  };
}
