import assert from "node:assert/strict";
import test from "node:test";
import { POST_LINKS, TOOL_LINKS, planInternalLinks, type Segment } from "../lib/blog-internal-links";
import type { BlogContentBlock } from "../types/blog";

const p = (text: string): BlogContentBlock => ({ type: "paragraph", text });
const h = (text: string): BlogContentBlock => ({ type: "heading", level: 2, text, anchor: "a" });
const links = (segs: Segment[] = []) => segs.filter((s): s is { text: string; href: string } => typeof s !== "string");
const flat = (segs: Segment[] = []) => segs.map((s) => (typeof s === "string" ? s : s.text)).join("");

test("a tool name already in the prose becomes a link, and the text is unchanged", () => {
  const text = "Use Frames to PDF to package the review, then send it on.";
  const plan = planInternalLinks([p(text)]);
  const segs = plan.get(0)!;
  assert.equal(flat(segs), text, "the rendered words must be identical to the source");
  assert.deepEqual(links(segs), [{ text: "Frames to PDF", href: "/learning/frames-to-pdf" }]);
});

test("only the FIRST occurrence is linked, however often the phrase appears", () => {
  /*
   * "Frames to PDF" appears 23 times across seven posts. Linking every one would
   * read as written-for-crawlers, which is its own ranking problem.
   */
  const plan = planInternalLinks([
    p("Frames to PDF is the export tool."),
    p("Open Frames to PDF again to change the DPI."),
    p("Frames to PDF also compresses."),
  ]);
  assert.equal(links(plan.get(0)).length, 1);
  assert.equal(plan.get(1), undefined, "second mention is left as plain text");
  assert.equal(plan.get(2), undefined);
});

test("headings, quotes and lists are never touched", () => {
  const plan = planInternalLinks([
    h("How Frames to PDF helps"),
    { type: "quote", text: "Frames to PDF changed our handoff." },
    { type: "list", style: "bullet", items: ["Frames to PDF", "Palettable"] },
  ]);
  assert.equal(plan.size, 0, "a link inside a heading would change the document outline");
});

test("a post is capped, so it cannot turn into a link farm", () => {
  const plan = planInternalLinks([
    p("Frames to PDF and File Importer."),
    p("Then HTML to Design and Icon Library."),
    p("Also Unit Converter and Palettable and Comment Summariser."),
  ]);
  /*
   * Exactly 5, not "at most 5". This fixture offers 7 distinct destinations, so it
   * is capped either way - and a one-sided bound is how a cap set too LOW ships
   * green. Mutation-tested: with `<=`, MAX_LINKS_PER_POST of 1, 2, 3 and 4 all
   * passed, as did the off-by-one `placed += 2`, while 1 deletes 8 of the 10
   * post-to-post links on the real corpus. With `equal` every one of those fails.
   */
  const total = [...plan.values()].reduce((n, segs) => n + links(segs).length, 0);
  assert.equal(total, 5, `expected exactly 5 links, got ${total}`);
});

test("both spellings of Comment Summariser resolve to one page, and only once", () => {
  const plan = planInternalLinks([p("The Comment Summariser helps."), p("Our Comment Summarizer also helps.")]);
  const all = [...plan.values()].flatMap((s) => links(s));
  assert.equal(all.length, 1, "the US spelling must not earn a second link to the same page");
  assert.equal(all[0].href, "/learning/comment-summariser");
});

test("partial words are never linked", () => {
  // "Palettable" must not match inside a longer word.
  const plan = planInternalLinks([p("The Palettables were fine.")]);
  assert.equal(plan.size, 0);
});

test("prose mentioning no tool is left completely alone", () => {
  const plan = planInternalLinks([p("A practical guide to sharing review links with clients.")]);
  assert.equal(plan.size, 0, "no plan means the renderer emits the original string");
});

test("a post never links to itself", () => {
  /*
   * "print-ready" appears in the very post that is canonical for it. Without the
   * slug guard that post would link to its own URL - noise for a reader and a
   * wasted signal for a crawler.
   */
  const blocks = [p("Set the DPI so the export is print-ready before sending.")];
  const own = planInternalLinks(blocks, "how-to-export-figma-frames-to-pdf-for-print-ready-files");
  assert.equal(own.size, 0, "the canonical must not link to itself");

  const other = planInternalLinks(blocks, "figma-export-settings-explained-for-client-review-pdfs");
  assert.deepEqual(links(other.get(0)), [
    { text: "print-ready", href: "/blogs/how-to-export-figma-frames-to-pdf-for-print-ready-files" },
  ]);
});

test("a satellite links up to the canonical for its cluster", () => {
  const plan = planInternalLinks(
    [p("Bundle the screens into a client review PDF before the meeting.")],
    "figma-export-settings-explained-for-client-review-pdfs",
  );
  assert.deepEqual(links(plan.get(0)), [
    { text: "client review PDF", href: "/blogs/how-to-turn-a-figma-concept-into-a-client-review-pdf" },
  ]);
});

test("no phrase contains another, so nothing can shred a longer anchor", () => {
  /*
   * This replaces a test that CLAIMED to prove longest-first ordering and proved
   * nothing: no two shipped phrases overlap, so reversing the sort - or deleting
   * it - still passed. The sort is insurance against a future entry, and this is
   * the precondition that makes its absence harmless today.
   *
   * If this ever fails, the new phrase overlaps an existing one: the sort becomes
   * load-bearing, and whoever added it needs to check the anchor that results.
   */
  const phrases = [...Object.keys(TOOL_LINKS), ...Object.keys(POST_LINKS)];
  for (const a of phrases) {
    for (const b of phrases) {
      if (a === b) continue;
      assert.ok(!a.includes(b), `"${b}" sits inside "${a}" - longest-first now decides the anchor`);
    }
  }
});

test("every post-to-post destination is the post whose title names the phrase", () => {
  /*
   * The canonical rule is the whole justification for the cluster design, and it
   * was documented but never checked: 5 of the 7 entries could have pointed at an
   * unrelated post and the suite stayed green.
   *
   * Checked through the slug rather than the title, because slugs are kebabed
   * titles - so this needs no database read and still pins the real rule.
   */
  for (const [phrase, slug] of Object.entries(POST_LINKS)) {
    const kebab = phrase.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    assert.ok(slug.includes(kebab), `"${phrase}" -> ${slug}, whose title does not name it`);
  }
});

test("a post really does receive links to two different destinations", () => {
  // Nothing else asserts more than one link, so "linking quietly stopped" had no
  // test that would notice. Two destinations, two paragraphs, both must land.
  const plan = planInternalLinks(
    [p("Open Frames to PDF first."), p("Then keep it print-ready.")],
    "unrelated-post",
  );
  const hrefs = [...plan.values()].flatMap((s) => links(s)).map((l) => l.href);
  assert.deepEqual(hrefs, [
    "/learning/frames-to-pdf",
    "/blogs/how-to-export-figma-frames-to-pdf-for-print-ready-files",
  ]);
});

test("tool links and post links share one budget", () => {
  const plan = planInternalLinks(
    [
      p("Frames to PDF and File Importer and Icon Library."),
      p("Then a client review PDF that is print-ready with export settings."),
      p("Plus HTML to Design and Palettable and APCA and a multi-page PDF."),
    ],
    "unrelated-post",
  );
  // Exact, for the reason above; this fixture offers 10 distinct destinations.
  const total = [...plan.values()].reduce((n, s) => n + links(s).length, 0);
  assert.equal(total, 5, `expected exactly 5 links across both kinds, got ${total}`);
});
