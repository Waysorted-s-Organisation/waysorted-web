type ToolLike = {
  slug?: string;
  icon?: string;
};

/**
 * The icon a tool should render, whatever its stored `icon` says.
 *
 * Two kinds of entry live here.
 *
 * The first is a tool whose art simply lives outside /icons.
 *
 * The second is a cache bust. `/icons/:path*` is served
 * `max-age=604800, stale-while-revalidate=2592000` (next.config.ts) - it used to
 * claim `immutable, max-age=31536000`, which is only ever true of a
 * content-addressed URL, and these filenames are hand-written.
 *
 * Shortening the header fixes the lie going forward but cannot recall the copies
 * already handed out under it, so redrawing an icon and keeping its filename is
 * still not enough. Production shows why: the retired `/icons/unit-converter.svg`
 * is gone from the deployment and the CDN still answers for it from a copy weeks
 * old, because the header it was fetched under promised a year. A content hash is
 * what actually guarantees the new art is the art that gets seen.
 *
 * So those two are renamed with a content hash and mapped here, which lands the
 * change without a database write. The stored value can be migrated at leisure,
 * or left; this map wins either way, and it is applied on every read path that
 * renders a tool icon (/api/tools/active, /learning, /learning/[toolName]).
 */
const TOOL_ICON_OVERRIDES: Record<string, string> = {
  "html-to-design": "/images/html-to-design/icon.svg",
  "icon-library": "/images/icon-library/icon.svg",
  // Was the Frames-to-PDF artwork translated 3px; redrawn from the design.
  "unit-converter": "/icons/unit-converter.504f23e5.svg",
  // Was locked.svg recoloured - a padlock under a correct-sounding filename.
  "comment-summariser": "/icons/comment-summarizer.d0bf7fd3.svg",
};

export function getToolIconOverride(slug?: string) {
  if (!slug) return undefined;
  return TOOL_ICON_OVERRIDES[slug];
}

export function applyToolIconOverride<T extends ToolLike>(tool: T): T {
  const override = getToolIconOverride(tool.slug);
  if (!override || tool.icon === override) return tool;

  return {
    ...tool,
    icon: override,
  };
}

export function applyToolIconOverrides<T extends ToolLike>(tools: T[]) {
  return tools.map(applyToolIconOverride);
}
