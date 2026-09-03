import assert from "node:assert/strict";
import test from "node:test";
import { prefersMarkdown, isNegotiablePath } from "../lib/markdown-negotiation";

// Real Accept headers, copied from what these clients actually send.
const BROWSERS: Array<[string, string]> = [
  ["Chrome", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"],
  ["Safari", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"],
  ["Firefox", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"],
  ["curl", "*/*"],
  ["fetch default", "*/*"],
  ["no header", ""],
  ["Googlebot", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"],
];

test("no browser is ever handed Markdown", () => {
  /*
   * The whole safety case rests here. Serving Markdown to a person would replace
   * the site with a wall of plain text, so every real-world browser header has to
   * come back false - including the bare wildcard, which matches text/markdown in
   * the HTTP grammar but only ever means "no opinion".
   */
  for (const [name, header] of BROWSERS) {
    assert.equal(prefersMarkdown(header), false, `${name} must get HTML: ${header}`);
  }
  assert.equal(prefersMarkdown(null), false);
  assert.equal(prefersMarkdown(undefined), false);
});

test("an agent that asks for Markdown by name gets it", () => {
  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("text/markdown, text/html;q=0.9"), true);
  assert.equal(prefersMarkdown("text/x-markdown"), true);
  assert.equal(prefersMarkdown("TEXT/MARKDOWN"), true);
  assert.equal(prefersMarkdown("text/markdown;q=1.0,text/html;q=0.5"), true);
});

test("naming Markdown is not enough - it has to outrank HTML", () => {
  // A client that would rather have the page gets the page.
  assert.equal(prefersMarkdown("text/html,text/markdown"), false, "equal q must lose");
  assert.equal(prefersMarkdown("text/html;q=1.0,text/markdown;q=0.8"), false);
  assert.equal(prefersMarkdown("text/markdown;q=0"), false, "q=0 is a refusal");
  assert.equal(prefersMarkdown("text/markdown;q=abc,text/html"), false, "unreadable q must not promote");
  assert.equal(prefersMarkdown("application/xhtml+xml,text/markdown"), false);
});

test("only pages are negotiable - never assets, APIs or Next internals", () => {
  for (const p of ["/", "/pricing", "/blogs/some-post", "/document-hub/faqs", "/learning/palettable"]) {
    assert.equal(isNegotiablePath(p), true, `${p} should be negotiable`);
  }
  for (const p of [
    "/api/billing/public-catalog", "/_next/static/chunk.js", "/md/pricing",
    "/images/og-image.e13cfee0.png", "/icons/logo-white.svg", "/fonts/x.woff2",
    "/favicon.ico", "/sitemap.xml", "/robots.txt", "/llms.txt",
  ]) {
    assert.equal(isNegotiablePath(p), false, `${p} must NOT be negotiable`);
  }
});
