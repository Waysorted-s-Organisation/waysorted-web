export const CANONICAL_HOST = "www.waysorted.com";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/**
 * True when a request arrived on a host that is not the canonical production
 * host but still serves the full site - i.e. a crawlable duplicate.
 *
 * waysorted-web.vercel.app was returning 200 with
 * `<meta name="robots" content="index, follow">` on every page, so the entire
 * site was reachable twice. The canonical tags did point at www, but a
 * canonical is a hint rather than a directive, so the duplicate could still be
 * indexed and it consumed crawl budget either way.
 *
 * Keyed on hostname rather than NODE_ENV on purpose: Vercel preview
 * deployments run with NODE_ENV=production, so an env check would miss them.
 */
export function isNonCanonicalHost(hostname: string | null | undefined) {
  if (!hostname) return false;

  const host = hostname.split(":")[0].trim().toLowerCase();
  if (!host) return false;

  if (host === CANONICAL_HOST) return false;
  // The apex is redirected to www before a page is ever rendered.
  if (host === "waysorted.com") return false;
  if (LOCAL_HOSTS.has(host)) return false;

  return true;
}
