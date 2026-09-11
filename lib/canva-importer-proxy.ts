const UUID_SEGMENT = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";

const ALLOWED_ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: "POST", pattern: /^capture-jobs$/ },
  { method: "GET", pattern: new RegExp(`^capture-jobs/${UUID_SEGMENT}$`) },
  { method: "DELETE", pattern: new RegExp(`^capture-jobs/${UUID_SEGMENT}$`) },
  { method: "GET", pattern: new RegExp(`^captures/${UUID_SEGMENT}$`) },
  {
    method: "GET",
    pattern: new RegExp(`^captures/${UUID_SEGMENT}/pages/${UUID_SEGMENT}/image$`),
  },
];

export function isAllowedCanvaImporterRoute(method: string, path: string) {
  return ALLOWED_ROUTES.some(
    (route) => route.method === method.toUpperCase() && route.pattern.test(path),
  );
}

export function resolveCanvaImporterBackend(
  rawValue: string | undefined,
  nodeEnv = process.env.NODE_ENV,
) {
  const raw = rawValue?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const local = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (parsed.protocol !== "https:" && !(nodeEnv !== "production" && local))
    ) {
      return null;
    }
    parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/`;
    return parsed;
  } catch {
    return null;
  }
}

export function buildCanvaImporterTarget(backend: URL, path: string) {
  return new URL(`api/${path}`, backend);
}
