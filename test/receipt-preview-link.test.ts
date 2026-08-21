import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const ROUTE = "../app/billing/receipt-preview/[key]/page.tsx";

test("the public receipt link is gated on both a key and an expiry", () => {
  /*
   * This renders what reads as a genuine Waysorted receipt on the marketing
   * domain. An unguessable URL keeps it from being found; the expiry keeps it
   * from outliving the reason it was opened, which is the failure mode that
   * actually happens - "temporary" pages are still public a year later because
   * whoever would have removed them moved on.
   */
  const url = new URL(ROUTE, import.meta.url);
  if (!existsSync(url)) return; // route already retired, nothing to guard
  const source = readFileSync(url, "utf8");

  assert.match(source, /if \(key !== PREVIEW_KEY\) notFound\(\);/, "must reject a wrong key");
  assert.match(source, /if \(Date\.now\(\) >= EXPIRES_AT\) notFound\(\);/, "must expire on its own");

  const key = source.match(/const PREVIEW_KEY = "([^"]+)"/)?.[1] ?? "";
  assert.ok(key.length >= 16, "the key IS the access control - keep it long");

  assert.match(source, /robots: \{ index: false, follow: false/, "must never be indexable");
});

test("the development-only preview stays development-only", () => {
  const source = readFileSync(new URL("../app/billing/receipt-preview/page.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/);
});
