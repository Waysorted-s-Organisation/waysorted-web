import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { getToolIconOverride } from "../lib/tool-icon-overrides";

const HASHED_ICONS = [
  { slug: "unit-converter", path: "/icons/unit-converter.504f23e5.svg" },
  { slug: "comment-summariser", path: "/icons/comment-summarizer.d0bf7fd3.svg" },
];

test("a hashed icon's filename actually matches its contents", () => {
  /*
   * /icons/:path* is served max-age=31536000, immutable. That is only true of a
   * content-addressed URL, so these two carry their hash in the filename. If the
   * art is redrawn without re-hashing, the header starts lying again and
   * returning visitors keep the old icon for a year.
   */
  for (const { path } of HASHED_ICONS) {
    const file = new URL(`../public${path}`, import.meta.url);
    assert.ok(existsSync(file), `${path} is missing`);
    const expected = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
    const actual = path.split(".").at(-2);
    assert.equal(actual, expected, `${path} is stale - rename it to .${expected}.svg`);
  }
});

test("the stored icon path is overridden, so no database write is needed", () => {
  // The live rows still say /icons/unit-converter.svg, which no longer exists.
  for (const { slug, path } of HASHED_ICONS) {
    assert.equal(getToolIconOverride(slug), path);
  }
});

test("nothing still points at the un-hashed names", () => {
  const sources = ["../scripts/seed-slides.ts", "../data/products.json"];
  for (const rel of sources) {
    const source = readFileSync(new URL(rel, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\/icons\/unit-converter\.svg/, `${rel} still references the old path`);
    assert.doesNotMatch(source, /\/icons\/comment-summarizer\.svg/, `${rel} still references the old path`);
  }
});
