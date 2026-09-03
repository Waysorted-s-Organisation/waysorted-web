import type { BlogContentBlock } from "@/types/blog";

/**
 * FAQPage structured data, derived from the Q&A a post already shows.
 *
 * Google requires the marked-up question and answer to be visible on the page and
 * to match it. Markup that does not is a manual-action risk, so nothing here is
 * authored: a question is a heading whose text ends in "?", and its answer is the
 * blocks that follow it until the next heading. If a post has no such headings it
 * gets no FAQPage at all - 14 of the 15 posts use this house format, and the one
 * that does not is correctly skipped.
 */
const MIN_ANSWER_CHARS = 40;

function textOf(block: BlogContentBlock): string {
  switch (block.type) {
    case "paragraph": return block.text;
    case "quote": return block.text;
    case "list": return block.items.join(" ");
    default: return "";
  }
}

export type FaqEntry = { question: string; answer: string };

export function extractFaq(blocks: BlogContentBlock[]): FaqEntry[] {
  const out: FaqEntry[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.type !== "heading") continue;
    const question = (b.text || "").trim();
    if (!question.endsWith("?")) continue;

    // Everything up to the next heading is the answer, exactly as rendered.
    const parts: string[] = [];
    for (let j = i + 1; j < blocks.length && blocks[j].type !== "heading"; j += 1) {
      const t = textOf(blocks[j]).trim();
      if (t) parts.push(t);
    }
    const answer = parts.join(" ").replace(/\s+/g, " ").trim();
    // A heading that merely ends in "?" with nothing under it is not an FAQ entry.
    if (answer.length >= MIN_ANSWER_CHARS) out.push({ question, answer });
  }
  return out;
}

export function faqPageJsonLd(blocks: BlogContentBlock[], pageUrl: string) {
  const entries = extractFaq(blocks);
  if (!entries.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}
