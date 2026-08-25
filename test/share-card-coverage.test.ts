import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP = new URL("../app/", import.meta.url).pathname;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /^(page|layout)\.tsx$/.test(entry) ? [full] : [];
  });
}

/** The `openGraph: { ... }` block, brace-matched so nested objects stay inside it. */
function openGraphBlocks(source: string) {
  const blocks: string[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf("openGraph: {", from);
    if (start === -1) return blocks;
    let depth = 0;
    let i = source.indexOf("{", start);
    const open = i;
    for (; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}" && --depth === 0) break;
    }
    blocks.push(source.slice(open, i + 1));
    from = i + 1;
  }
}

test("every page that declares openGraph also declares its image", () => {
  /*
   * A page's `openGraph` REPLACES the root layout's rather than merging into it.
   * /pricing named a title and a url and nothing else, which silently dropped the
   * share image - so the most commercially important page on the site shared with
   * no card at all on LinkedIn, Facebook, WhatsApp and Slack.
   *
   * It kept twitter:image the whole time, because it declares no `twitter` block
   * and that one does inherit. That asymmetry is why this went unnoticed: the card
   * looked fine on X and nowhere else.
   */
  const offenders: string[] = [];
  for (const file of walk(APP)) {
    const source = readFileSync(file, "utf8");
    for (const block of openGraphBlocks(source)) {
      if (!/\bimages\s*:/.test(block)) offenders.push(relative(APP, file));
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `these declare openGraph without images, so they inherit no share card:\n  ${offenders.join("\n  ")}`,
  );
});
