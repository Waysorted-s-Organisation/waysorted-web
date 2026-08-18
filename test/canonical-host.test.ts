import assert from "node:assert/strict";
import test from "node:test";
import { isNonCanonicalHost } from "../lib/canonical-host";

test("the production host is never marked non-canonical", () => {
  assert.equal(isNonCanonicalHost("www.waysorted.com"), false);
  assert.equal(isNonCanonicalHost("WWW.WAYSORTED.COM"), false);
  assert.equal(isNonCanonicalHost("www.waysorted.com:443"), false);
});

test("the apex is not flagged - it is redirected to www before rendering", () => {
  assert.equal(isNonCanonicalHost("waysorted.com"), false);
});

test("local development hosts are not flagged", () => {
  assert.equal(isNonCanonicalHost("localhost"), false);
  assert.equal(isNonCanonicalHost("localhost:3000"), false);
  assert.equal(isNonCanonicalHost("127.0.0.1:3111"), false);
  assert.equal(isNonCanonicalHost("0.0.0.0:8080"), false);
});

test("Vercel deployment hosts are flagged so they can be noindexed", () => {
  assert.equal(isNonCanonicalHost("waysorted-web.vercel.app"), true);
  assert.equal(
    isNonCanonicalHost("waysorted-web-git-some-branch-waysorteds-projects.vercel.app"),
    true,
  );
});

test("any other host serving the site is flagged", () => {
  assert.equal(isNonCanonicalHost("staging.waysorted.com"), true);
  assert.equal(isNonCanonicalHost("waysorted.in"), true);
});

test("missing or empty hosts are treated as canonical so nothing is noindexed by accident", () => {
  assert.equal(isNonCanonicalHost(undefined), false);
  assert.equal(isNonCanonicalHost(null), false);
  assert.equal(isNonCanonicalHost(""), false);
  assert.equal(isNonCanonicalHost("   "), false);
});
