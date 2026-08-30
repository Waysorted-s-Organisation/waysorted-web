import "server-only";
import { CANONICAL_HOST } from "@/lib/canonical-host";

/*
 * Purge Cloudflare's cache when content changes.
 *
 * Cloudflare sits in front of this origin and is the layer that actually decides
 * how long a visitor keeps an old copy. Without a purge, "publish" only changes
 * what the origin would say - it does not change what anyone is served.
 *
 * This is not hypothetical. Commit 951a0f1 (22 Aug 2026) changed /icons from
 * `immutable`/1y to a week plus stale-while-revalidate, precisely so a redrawn
 * icon would reach people. Cloudflare had already cached the pre-fix response and
 * `immutable` tells a cache never to revalidate, so three weeks later the edge was
 * still handing out `max-age=31536000, immutable` and the fix had reached nobody.
 * A purge is the only thing that releases a state like that.
 *
 * PLAN LIMIT: purge-by-prefix and purge-by-tag are Enterprise features. On Free
 * the options are exact URLs (30 per call) or purge-everything. Everything here
 * is built around exact URLs, because purging everything to release one blog post
 * also throws away every cached asset the site depends on.
 */

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

/*
 * A purge must never be able to fail a publish.
 *
 * The write to Mongo has already happened by the time we get here; throwing now
 * would report failure for an operation that succeeded, and an operator retrying
 * it would be re-running a write that already landed. Every failure path below
 * therefore returns a result object and logs - nothing throws, and nothing
 * rejects.
 */
export type PurgeResult =
  | { ok: true; purged: number }
  | { ok: false; skipped: "not_configured" }
  | { ok: false; error: string };

function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  return configured || `https://${CANONICAL_HOST}`;
}

/**
 * Turn paths into the absolute URLs Cloudflare keys its cache on.
 *
 * The cache key is the full URL, so a path alone purges nothing. Query strings
 * are part of the key too - which is why an image variant has to be purged by its
 * exact `/_next/image?url=...&w=...&q=...` URL rather than by the source path.
 */
export function toPurgeUrls(paths: string[]) {
  const origin = siteOrigin();
  return Array.from(
    new Set(paths.map((p) => (p.startsWith("http") ? p : `${origin}${p.startsWith("/") ? p : `/${p}`}`))),
  );
}

/**
 * Purge specific URLs from Cloudflare's edge cache.
 *
 * Returns rather than throws; see PurgeResult. When the credentials are absent
 * this is a deliberate no-op, so local development and any deployment that has
 * not been given a token behave exactly as they do today instead of erroring on
 * every publish.
 */
export async function purgeUrls(paths: string[], context = "purge"): Promise<PurgeResult> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
  const token = process.env.CLOUDFLARE_PURGE_TOKEN?.trim();

  if (!zoneId || !token) {
    console.warn(`[cloudflare-purge] ${context}: skipped, CLOUDFLARE_ZONE_ID/PURGE_TOKEN not set`);
    return { ok: false, skipped: "not_configured" };
  }

  const urls = toPurgeUrls(paths);
  if (urls.length === 0) return { ok: true, purged: 0 };

  /*
   * 30 URLs per request is the documented Free-plan ceiling. Chunk rather than
   * truncate: a silently dropped URL is a page that stays stale with no signal.
   */
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += 30) chunks.push(urls.slice(i, i + 30));

  let purged = 0;
  for (const chunk of chunks) {
    /*
     * A publish request is already waiting on Mongo. Cap this so a slow or
     * unreachable Cloudflare API cannot hold the response open - five seconds is
     * far above the normal round trip and well below anything a user notices.
     */
    const abort = AbortSignal.timeout(5000);
    try {
      const res = await fetch(`${CLOUDFLARE_API}/zones/${zoneId}/purge_cache`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: chunk }),
        signal: abort,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const detail = body.slice(0, 300);
        console.error(`[cloudflare-purge] ${context}: HTTP ${res.status}`, { detail, count: chunk.length });
        return { ok: false, error: `http_${res.status}` };
      }

      /*
       * Cloudflare answers 200 with `success: false` for authorization and
       * validation problems. Treating a 200 as success would report a purge that
       * never happened, which is the one outcome worse than a loud failure.
       */
      const json = (await res.json().catch(() => null)) as { success?: boolean; errors?: unknown } | null;
      if (!json?.success) {
        console.error(`[cloudflare-purge] ${context}: API reported failure`, {
          errors: JSON.stringify(json?.errors ?? "unparseable").slice(0, 300),
        });
        return { ok: false, error: "api_unsuccessful" };
      }

      purged += chunk.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[cloudflare-purge] ${context}: request failed`, { error: message });
      return { ok: false, error: message };
    }
  }

  console.log(`[cloudflare-purge] ${context}: purged ${purged} URL(s)`);
  return { ok: true, purged };
}

/*
 * The URL sets below are grouped by the thing that changed, so a caller names an
 * event rather than remembering which listing pages, feeds and machine-readable
 * mirrors quietly embed the same content.
 */

/** A blog post appeared, changed or was withdrawn. */
export function blogPurgePaths(slug: string) {
  return [
    `/blogs/${slug}`,
    "/blogs",
    "/blogs/rss.xml",
    "/sitemap.xml",
    "/llms.txt",
    // The Markdown mirror is a separate cache entry under its own path, so it
    // survives a purge of the HTML URL unless it is named explicitly.
    `/md/blogs/${slug}`,
    "/md/blogs",
  ];
}

/** The public coupon ladder changed - the Header banner reads this on every page. */
export function couponPurgePaths() {
  return ["/api/billing/coupons/public-ladder"];
}

/** The tool catalogue changed - the Footer and /learning read this. */
export function toolPurgePaths(slugs: string[] = []) {
  return [
    "/api/tools/active",
    "/learning",
    "/sitemap.xml",
    "/llms.txt",
    ...slugs.flatMap((s) => [`/learning/${s}`, `/md/learning/${s}`]),
  ];
}
