import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { getToolIconOverride } from "../lib/tool-icon-overrides";

const HASHED_ICONS = [
  { slug: "unit-converter", path: "/icons/unit-converter.504f23e5.svg" },
  { slug: "comment-summariser", path: "/icons/comment-summarizer.d0bf7fd3.svg" },
];

test("a hashed icon's filename actually matches its contents", () => {
  /*
   * /icons/:path* is served max-age=604800, stale-while-revalidate=2592000, and
   * these filenames are hand-written - so the URL is not content-addressed and
   * the only thing making a redraw visible is the hash in the name.
   *
   * Shortening the header (it used to claim immutable, max-age=31536000) does not
   * recall what was already cached under it: production still answers for the
   * retired /icons/unit-converter.svg from a copy weeks old. Redraw without
   * re-hashing and returning visitors keep the old icon.
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

test("the share card's filename matches its contents, and nothing references the old one", () => {
  /*
   * Same reasoning as the icons above, learned the hard way on this exact file.
   *
   * /images/og-image.png was replaced with new artwork and the edge kept serving
   * the previous one: it had been fetched back when /images/:path* still claimed
   * `immutable, max-age=31536000`, and shortening the header does not recall a
   * copy already handed out under the old one. For a week after the swap, every
   * scraper - Slack, Discord, X, LinkedIn - was still showing the retired card.
   *
   * So the share card carries its hash too. Replace the artwork and this test
   * fails until the filename is regenerated, which is the whole point: a new URL
   * is the only thing that reliably reaches a cache, and it doubles as a bust for
   * the scrapers that key their own previews by URL.
   */
  const path = "/images/og-image.e13cfee0.png";
  const file = new URL(`../public${path}`, import.meta.url);
  assert.ok(existsSync(file), `${path} is missing`);

  const expected = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
  assert.equal(
    path.split(".").at(-2),
    expected,
    `${path} is stale - rename it to og-image.${expected}.png and update the references`,
  );

  // Built from `path` rather than written out again. Spelling the hash a second
  // time is how this test first failed: a rename updated the string above and
  // missed the escaped copy inside the regex.
  const literal = new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const unhashed = /og-image\.png/;

  const root = new URL("../", import.meta.url);

  // The layout is the source of truth - pages inherit its openGraph unless they
  // declare their own. app/page.tsx used to restate the image and nothing else,
  // which REPLACED the layout's block and cost the homepage og:type, og:url and
  // og:site_name; it now inherits, so it must NOT be required to name the file.
  const layout = readFileSync(new URL("app/layout.tsx", root), "utf8");
  assert.match(layout, literal, `app/layout.tsx should use ${path}`);

  // Nothing anywhere may still point at the un-hashed name, whoever declares it.
  const appDir = new URL("app/", root).pathname;
  const offenders: string[] = [];
  (function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry) && unhashed.test(readFileSync(full, "utf8"))) {
        offenders.push(relative(appDir, full));
      }
    }
  })(appDir);
  assert.deepEqual(offenders, [], `these still point at the un-hashed share card:\n  ${offenders.join("\n  ")}`);
});
