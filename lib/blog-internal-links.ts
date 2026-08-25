import type { BlogContentBlock } from "@/types/blog";

/**
 * Links tool names already written in the prose to their own pages.
 *
 * The blog had no internal links at all: `paragraph` is a plain string and the
 * renderer emitted `<p>{text}</p>`, so a live post body contained zero anchors.
 * Every post was an island, and none of them pointed at the product they describe.
 *
 * Nothing is inserted. These phrases are ALREADY in the copy - "Frames to PDF"
 * appears in seven posts, "Palettable" in two - so the anchor text is the author's
 * own words and the page reads exactly as before, minus the underline. That is the
 * whole reason for doing it this way rather than appending a "Related guides"
 * block: no new section, no layout shift, nothing moves.
 *
 * Deliberately restrained, because over-linking is its own SEO problem:
 *   - a curated map only, never fuzzy matching
 *   - the FIRST occurrence of each phrase per post, once
 *   - paragraphs only, never a heading, quote or list
 *   - a hard cap per post
 *   - longest phrase first, so "Comment Summariser" cannot be eaten by a shorter key
 */
const TOOL_LINKS: Record<string, string> = {
  "Frames to PDF": "/learning/frames-to-pdf",
  "File Importer": "/learning/file-importer",
  "HTML to Design": "/learning/html-to-design",
  "Icon Library": "/learning/icon-library",
  "Unit Converter": "/learning/unit-converter",
  "Comment Summariser": "/learning/comment-summariser",
  "Comment Summarizer": "/learning/comment-summariser",
  Palettable: "/learning/palettable",
};

/** Above this a post reads as written for crawlers rather than for people. */
const MAX_LINKS_PER_POST = 4;

export type Segment = string | { text: string; href: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Which paragraphs get which links, decided for the whole post at once.
 *
 * Computed up front rather than during render so the result cannot depend on the
 * order React happens to call things in, and so it can be tested directly.
 */
export function planInternalLinks(blocks: BlogContentBlock[]): Map<number, Segment[]> {
  const plan = new Map<number, Segment[]>();
  const used = new Set<string>();
  let placed = 0;

  // Longest first: "Comment Summariser" must win before any shorter key matches.
  const phrases = Object.keys(TOOL_LINKS).sort((a, b) => b.length - a.length);

  blocks.forEach((block, index) => {
    if (block.type !== "paragraph") return;
    if (placed >= MAX_LINKS_PER_POST) return;

    let segments: Segment[] = [block.text];
    let touched = false;

    for (const phrase of phrases) {
      const href = TOOL_LINKS[phrase];
      // One link per destination per post - two spellings of the same tool must
      // not both fire.
      if (used.has(href)) continue;
      if (placed >= MAX_LINKS_PER_POST) break;

      const re = new RegExp(`\\b${escapeRe(phrase)}\\b`);
      const next: Segment[] = [];
      let done = false;

      for (const seg of segments) {
        if (done || typeof seg !== "string") { next.push(seg); continue; }
        const m = seg.match(re);
        if (!m || m.index === undefined) { next.push(seg); continue; }
        const before = seg.slice(0, m.index);
        const after = seg.slice(m.index + m[0].length);
        if (before) next.push(before);
        next.push({ text: m[0], href });
        if (after) next.push(after);
        done = true;
      }

      if (done) { segments = next; used.add(href); placed += 1; touched = true; }
    }

    if (touched) plan.set(index, segments);
  });

  return plan;
}
