import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { buildLlmsTxt } from "../lib/llms-txt";

// Built with no posts: the static sections are what this file can check offline.
const llms = buildLlmsTxt([]);
const SITE = "https://www.waysorted.com";

/** Every markdown link that points at our own site. */
function ownLinks() {
  return [...llms.matchAll(/\]\((https:\/\/www\.waysorted\.com[^)]*)\)/g)].map((m) => m[1]);
}

test("llms.txt only points at paths this app actually serves", () => {
  /*
   * llms.txt is the index an agent follows, so a dead link there is a dead end
   * in the one file written specifically for them. It carried five links to
   * /docs/* - a route this app has never had, the real one is /document-hub -
   * plus /learning/pdf-exporter and /learning/import-tool, which are tool slugs
   * that do not exist. Those two returned HTTP 200 with a "Tool Not Found" body,
   * so a status check alone would not have caught them.
   *
   * This resolves each path against the route tree rather than over the network,
   * so it works offline and in CI. Dynamic segments are matched by their folder.
   */
  const appDir = new URL("../app/", import.meta.url).pathname;

  const staticRoutes = new Set<string>();
  const dynamicRoots = new Set<string>();
  (function walk(dir: string, route: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) continue;
      if (entry.startsWith("_") || entry === "api") continue;
      // route groups like (marketing) do not appear in the URL
      const segment = entry.startsWith("(") && entry.endsWith(")") ? "" : `/${entry}`;
      const next = entry.startsWith("[") ? route : `${route}${segment}`;
      if (entry.startsWith("[")) dynamicRoots.add(route || "/");
      else if (existsSync(join(full, "page.tsx"))) staticRoutes.add(next);
      walk(full, next);
    }
  })(appDir, "");
  staticRoutes.add("/");

  const bad: string[] = [];
  for (const link of ownLinks()) {
    const path = link.replace(SITE, "") || "/";
    if (staticRoutes.has(path)) continue;
    // a dynamic route serves the parent, e.g. /learning/[toolName] serves /learning/x
    const parent = path.slice(0, path.lastIndexOf("/")) || "/";
    if (dynamicRoots.has(parent)) continue;
    bad.push(path);
  }
  assert.deepEqual(bad, [], `llms.txt points at paths with no route:\n  ${bad.join("\n  ")}`);
});

test("llms.txt names only tool slugs the app really has", () => {
  // /learning/[toolName] renders "Tool Not Found" for an unknown slug and still
  // answers 200, so a bad slug hides behind a healthy status code. The slugs are
  // database rows, so this pins them against the seed script instead.
  const seed = readFileSync(new URL("../scripts/seed-slides.ts", import.meta.url), "utf8");
  const referenced = [...llms.matchAll(/\/learning\/([a-z0-9-]+)\)/g)].map((m) => m[1]);
  assert.ok(referenced.length > 0, "llms.txt should link at least one tool");

  const missing = referenced.filter((slug) => !seed.includes(`"${slug}"`) && !seed.includes(`'${slug}'`));
  assert.deepEqual(missing, [], `llms.txt links tool slugs the seed does not define:\n  ${missing.join("\n  ")}`);
});

test("llms.txt tells an agent when to reach for this product", () => {
  // An index of links says what exists, not when to use it. Without this an
  // agent has only marketing copy to decide whether the product fits the task.
  assert.match(llms, /##\s*When to use/i, "llms.txt needs a 'When to use' section");
  assert.match(llms, /pricing/i, "llms.txt should point at pricing - agents are asked about it constantly");
});
