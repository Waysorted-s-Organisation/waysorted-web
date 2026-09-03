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
export const TOOL_LINKS: Record<string, string> = {
  "Frames to PDF": "/learning/frames-to-pdf",
  "File Importer": "/learning/file-importer",
  "HTML to Design": "/learning/html-to-design",
  "Icon Library": "/learning/icon-library",
  "Unit Converter": "/learning/unit-converter",
  "Comment Summariser": "/learning/comment-summariser",
  "Comment Summarizer": "/learning/comment-summariser",
  Palettable: "/learning/palettable",
};

/*
 * Post-to-post links, phrase -> the post that should rank for it.
 *
 * Six posts competed for Figma-to-PDF queries with nothing telling Google which
 * one to rank. Rather than crown a single winner and demote five, each post owns
 * the sub-intent its own TITLE names, and the others link up to it. Every
 * canonical below contains its phrase in its title, which the tests check via the
 * slug (slugs are kebabed titles, so no database read is needed).
 *
 * That rule narrows the field but does not always land on one post: two phrases
 * here have two title-owners each. The tie-break is which title the phrase is the
 * SUBJECT of rather than a qualifier on.
 *   "client review PDF" - "...into a Client Review PDF" is about producing one;
 *      "Figma Export Settings Explained for Client Review PDFs" is about the
 *      settings, for that audience. The first wins.
 *   "APCA" - "APCA vs WCAG Contrast in Figma" is about APCA; "How to Check Color
 *      Contrast inside Figma (WCAG & APCA Explained)" is about contrast checking
 *      generally. The first wins, even though the second mentions APCA more often.
 * So it is checkable, then judged - not purely checkable. Saying otherwise would
 * be claiming more rigour than this has.
 *
 * A phrase only earns a link where it appears in a DIFFERENT post's prose. All of
 * these were measured against real paragraph text first: a phrase that lives only
 * in its own canonical can never render, and a phrase matching one post only has
 * no satellite to link from. "review PDF" was rejected for the opposite reason -
 * it appears in five posts and is too generic to carry meaning.
 */
export const POST_LINKS: Record<string, string> = {
  "client review PDF": "how-to-turn-a-figma-concept-into-a-client-review-pdf",
  "multi-page PDF": "how-to-organize-figma-frames-before-exporting-a-multi-page-pdf",
  "editable Figma layers": "how-to-convert-a-live-website-into-editable-figma-layers-for-redesign-work",
  "stakeholder review": "how-to-package-figma-screens-for-weekly-stakeholder-reviews",
  "export settings": "figma-export-settings-explained-for-client-review-pdfs",
  "print-ready": "how-to-export-figma-frames-to-pdf-for-print-ready-files",
  APCA: "apca-vs-wcag-contrast-in-figma-when-to-check-both",
};

/**
 * Above this a post reads as written for crawlers rather than for people.
 *
 * Not currently binding: the busiest real post emits 4, so 4 and 5 produce
 * identical output across all 18 posts. It is headroom for the table growing, and
 * the tests pin it from BOTH sides - a cap set too low would quietly delete the
 * post-to-post links (a post's own tool mention usually sits in an earlier
 * paragraph and eats the budget first) and would otherwise ship green.
 */
const MAX_LINKS_PER_POST = 5;

export type Segment = string | { text: string; href: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Which paragraphs get which links, decided for the whole post at once.
 *
 * Computed up front rather than during render so the result cannot depend on the
 * order React happens to call things in, and so it can be tested directly.
 */
export function planInternalLinks(blocks: BlogContentBlock[], currentSlug?: string): Map<number, Segment[]> {
  const plan = new Map<number, Segment[]>();
  const used = new Set<string>();
  let placed = 0;

  /*
   * One table, tools and posts together, so the per-post cap and the
   * one-link-per-destination rule apply across both rather than each getting its
   * own budget. A post's own canonical entry is dropped outright - a page linking
   * to itself is noise to a reader and a wasted signal to a crawler.
   */
  const targets: Record<string, string> = { ...TOOL_LINKS };
  for (const [phrase, slug] of Object.entries(POST_LINKS)) {
    if (currentSlug && slug === currentSlug) continue;
    targets[phrase] = `/blogs/${slug}`;
  }

  // Longest first: "client review PDF" must win before "export settings" or a
  // shorter tool key can claim part of the same sentence.
  const phrases = Object.keys(targets).sort((a, b) => b.length - a.length);

  blocks.forEach((block, index) => {
    if (block.type !== "paragraph") return;
    if (placed >= MAX_LINKS_PER_POST) return;

    let segments: Segment[] = [block.text];
    let touched = false;

    for (const phrase of phrases) {
      const href = targets[phrase];
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
