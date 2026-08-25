import assert from "node:assert/strict";
import test from "node:test";
import { planInternalLinks, type Segment } from "../lib/blog-internal-links";
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
  const total = [...plan.values()].reduce((n, segs) => n + links(segs).length, 0);
  assert.ok(total <= 4, `expected at most 4 links, got ${total}`);
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
