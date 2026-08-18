import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

/**
 * Guards against SEO regressions that have already happened once in this repo.
 *
 * These are source-level assertions on purpose: they are fast, need no running
 * server, and run on every PR. Each test below corresponds to a real defect
 * that made the site unindexable, not a hypothetical one. A header redesign
 * silently reintroduced two of them within a week of the original fix, which is
 * why they are pinned here rather than left to review.
 */

const root = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
/** Strip comments so a rule is never satisfied (or tripped) by prose. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

test("root layout does not set alternates.canonical", () => {
  // App Router metadata is inherited by every child segment that does not
  // override it, so a canonical here makes every page declare itself a
  // duplicate of the homepage. /learning/*, /pricing and /get-early-access
  // were all de-indexed this way.
  const layout = code("app/layout.tsx");
  const alternates = layout.match(/alternates:\s*\{[\s\S]*?\n\s{2}\}/);
  if (alternates) {
    assert.doesNotMatch(
      alternates[0],
      /canonical/,
      "app/layout.tsx must not set alternates.canonical - it is inherited by every page",
    );
  }
});

test("no fabricated aggregateRating in the global structured data", () => {
  // A 4.8-from-100-ratings block was injected on every page with no reviews
  // anywhere on the site, which violates Google's review snippet policy.
  assert.doesNotMatch(
    code("app/layout.tsx"),
    /aggregateRating\s*:/,
    "Re-add aggregateRating only alongside real, on-page reviews",
  );
});

test("public navigation uses <Link>, not router.push", () => {
  // Google can only follow an <a> element with an href. As buttons these nav
  // items produced no crawl path at all, leaving /blogs and /pricing with zero
  // crawlable inbound links anywhere on the site.
  const navFiles = [
    "components/Header/index.tsx",
    "components/ResourcesMenu/index.tsx",
    "components/ProductsMenu/index.tsx",
    "components/Hero/index.tsx",
  ];
  // Routes that are noindex or robots-disallowed may stay imperative.
  const exempt = new Set(["/signup", "/login", "/mobile-redirect", "/settings"]);

  const offenders: string[] = [];
  for (const file of navFiles) {
    const src = code(file);
    for (const m of src.matchAll(/router\.push\(\s*['"`](\/[A-Za-z0-9/_-]*)['"`]/g)) {
      if (!exempt.has(m[1])) offenders.push(`${file} -> ${m[1]}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `These nav destinations are not crawlable. Use <Link href> instead:\n  ${offenders.join("\n  ")}`,
  );
});

test("homepage sections are server-rendered by default", () => {
  const home = code("components/Home/index.tsx");

  // `ssr: false` kept every below-the-fold section out of the server HTML.
  assert.doesNotMatch(
    home,
    /ssr:\s*false/,
    "Below-the-fold sections must be server-rendered so their copy and links are indexable",
  );

  // A later redesign achieved the same damage with an IntersectionObserver
  // gate. Deferral must stay opt-in, so the default has to be "render".
  const lazyDefault = home.match(/defer\s*=\s*(true|false)/);
  if (lazyDefault) {
    assert.equal(
      lazyDefault[1],
      "false",
      "LazySection must render by default; pass `defer` only for decorative sections",
    );
  }
});

test("robots.txt does not block images or Googlebot-Image", () => {
  const robots = code("app/robots.ts");
  assert.doesNotMatch(
    robots,
    /Googlebot-Image/,
    "Blocking Googlebot-Image removes image search traffic and Discover eligibility",
  );
  assert.doesNotMatch(
    robots,
    /\/\*\.(png|jpe?g|gif|svg|webp)\$/,
    "Blocking image extensions stops result thumbnails from being generated",
  );
});

test("every static sitemap route resolves to a real page", () => {
  // '/docs' and three /document-hub slugs were submitted to Google as 404s.
  // Comment-stripped: the source documents those removed slugs by name, and
  // reading the raw file would match them out of the comment.
  const sitemap = code("app/sitemap.ts");

  const listOf = (name: string) => {
    const block = sitemap.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n\\s*\\]`));
    if (!block) return [];
    return [...block[1].matchAll(/['"]([^'"]*)['"]/g)].map((m) => m[1]);
  };

  const missing: string[] = [];

  for (const p of listOf("mainPages")) {
    if (p === "") continue;
    const seg = p.replace(/^\//, "");
    const exists =
      fs.existsSync(path.join(root, "app", seg, "page.tsx")) ||
      fs.existsSync(path.join(root, "app", seg, "page.ts"));
    if (!exists) missing.push(p);
  }

  for (const slug of listOf("docPages")) {
    const exists = fs.existsSync(
      path.join(root, "app/document-hub/[slug]/content", `${slug}.tsx`),
    );
    if (!exists) missing.push(`/document-hub/${slug}`);
  }

  assert.deepEqual(
    missing,
    [],
    `Sitemap lists routes with no corresponding page:\n  ${missing.join("\n  ")}`,
  );
});

test("sitemap does not hardcode a fresh lastModified for every URL", () => {
  // Stamping every entry with now() on each request taught Google to distrust
  // our lastmod entirely.
  const sitemap = code("app/sitemap.ts");
  const staticEntries = sitemap.match(/lastModified:\s*currentDate/g) ?? [];
  assert.equal(
    staticEntries.length,
    0,
    "Use a real modification date, not the current time, for static sitemap entries",
  );
});
