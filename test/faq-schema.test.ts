import assert from "node:assert/strict";
import test from "node:test";
import { extractFaq, faqPageJsonLd } from "../lib/faq-schema";
import type { BlogContentBlock } from "../types/blog";

const h = (text: string, level: 2 | 3 = 2): BlogContentBlock => ({ type: "heading", level, text, anchor: "a" });
const p = (text: string): BlogContentBlock => ({ type: "paragraph", text });

test("a question heading becomes an entry, with the prose beneath it as the answer", () => {
  const blocks: BlogContentBlock[] = [
    h("Some section"), p("Not a question, so not an entry."),
    h("Should I still check WCAG if I use APCA?"),
    p("Yes. WCAG contrast guidance is still a common baseline for product accessibility review."),
    h("Next section"), p("Unrelated prose that must not leak into the answer above."),
  ];
  const faq = extractFaq(blocks);
  assert.equal(faq.length, 1);
  assert.equal(faq[0].question, "Should I still check WCAG if I use APCA?");
  assert.match(faq[0].answer, /^Yes\. WCAG contrast guidance/);
  assert.doesNotMatch(faq[0].answer, /must not leak/, "the answer stops at the next heading");
});

test("nothing is emitted for a post without question headings", () => {
  /*
   * One published post uses no Q&A format. Emitting an empty or invented FAQPage
   * for it would be markup that does not match the page, which is the thing this
   * whole approach exists to avoid.
   */
  const blocks: BlogContentBlock[] = [h("Just a section"), p("Prose with no questions at all here.")];
  assert.deepEqual(extractFaq(blocks), []);
  assert.equal(faqPageJsonLd(blocks, "https://x.test/p"), null);
});

test("a question heading with no answer under it is skipped", () => {
  // A dangling question would produce a Question with an empty acceptedAnswer,
  // which is invalid structured data.
  const blocks: BlogContentBlock[] = [h("A question with nothing under it?"), h("Next")];
  assert.deepEqual(extractFaq(blocks), []);
  assert.deepEqual(extractFaq([h("Too short?"), p("Yes.")]), [], "a one-word answer is not an answer");
});

test("lists and quotes under a question are part of the answer", () => {
  const blocks: BlogContentBlock[] = [
    h("What should I compare first?"),
    p("Start with the pages that carry the most traffic and revenue."),
    { type: "list", style: "bullet", items: ["Navigation", "Hero", "Primary call to action"] },
  ];
  const faq = extractFaq(blocks);
  assert.equal(faq.length, 1);
  assert.match(faq[0].answer, /Navigation Hero Primary call to action/);
});

test("the emitted JSON-LD is a valid FAQPage", () => {
  const blocks: BlogContentBlock[] = [
    h("Can Figma export frames as PDF?"),
    p("Yes, Figma can export frames to PDF directly from the export panel in the right sidebar."),
  ];
  const ld = faqPageJsonLd(blocks, "https://www.waysorted.com/blogs/x") as Record<string, unknown>;
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld["@context"], "https://schema.org");
  const main = ld.mainEntity as Array<Record<string, unknown>>;
  assert.equal(main.length, 1);
  assert.equal(main[0]["@type"], "Question");
  assert.equal(main[0].name, "Can Figma export frames as PDF?");
  const ans = main[0].acceptedAnswer as Record<string, unknown>;
  assert.equal(ans["@type"], "Answer");
  assert.ok(String(ans.text).length >= 40);
});
