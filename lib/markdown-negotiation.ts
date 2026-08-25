/**
 * Decides whether a request is asking for Markdown instead of the page.
 *
 * This gate is the only thing standing between a browser and a page of raw
 * Markdown, so it is deliberately strict: a client gets Markdown ONLY if it named
 * `text/markdown` explicitly AND ranked it above `text/html`. Everything else -
 * every browser, every bare wildcard from curl, every empty header - is left on the
 * normal HTML path, byte for byte as before.
 *
 * Wildcards never qualify. A wildcard range does match text/markdown in the HTTP
 * grammar, but it is what a client sends when it has no opinion, and "no opinion"
 * must mean the page. Only an explicit text/markdown counts.
 */
type Range = { type: string; q: number; specific: boolean };

function parseAccept(header: string): Range[] {
  return header
    .split(",")
    .map((part) => {
      const [rawType, ...params] = part.trim().split(";");
      const type = rawType.trim().toLowerCase();
      if (!type) return null;
      let q = 1;
      for (const p of params) {
        const [k, v] = p.split("=").map((x) => x.trim().toLowerCase());
        if (k === "q") {
          const parsed = Number.parseFloat(v);
          // A malformed q is treated as 0: an unreadable preference is not a
          // preference, and defaulting it to 1 could promote markdown by accident.
          q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
        }
      }
      return { type, q, specific: !type.includes("*") };
    })
    .filter((r): r is Range => r !== null);
}

export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  if (!acceptHeader) return false;
  const ranges = parseAccept(acceptHeader);
  if (!ranges.length) return false;

  const markdown = ranges.find((r) => r.specific && (r.type === "text/markdown" || r.type === "text/x-markdown"));
  if (!markdown || markdown.q <= 0) return false;

  // Beat every *specific* HTML-ish alternative the client named. A browser sends
  // text/html at q=1, so it can never reach here.
  const html = ranges.filter(
    (r) => r.specific && (r.type === "text/html" || r.type === "application/xhtml+xml"),
  );
  return html.every((r) => markdown.q > r.q);
}

/** Paths that must never be negotiated - assets, APIs, and Next's own plumbing. */
export function isNegotiablePath(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/md/") || pathname === "/md" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/pricingIcons/")
  ) return false;
  // Anything with a file extension is an asset, not a page.
  const last = pathname.split("/").pop() || "";
  return !last.includes(".");
}
