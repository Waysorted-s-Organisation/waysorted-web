/**
 * Three billing endpoints run at once every time the checkout page mounts.
 *
 * `/api/billing/snapshot`, `/api/billing/subscriptions/current` and `/api/me`
 * all resolve the user's pricing context, and that function persists a geo
 * observation on every read. UserBilling sets `optimisticConcurrency: true` -
 * correctly, to stop credit writes clobbering each other - which means every
 * `save()` carries a version check. Three concurrent saves meant two lost, and
 * a VersionError surfaced as a 500 from whichever endpoint lost the race.
 *
 * In production that read as "Unable to load billing snapshot." on a checkout
 * page where nothing was wrong, and it reproduced on roughly every page load.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

const db = read("lib/billing/db.ts");
const userBillingModel = read("models/userBilling.ts");

function bodyOf(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  assert.ok(start >= 0, `${startMarker} must exist`);
  const end = source.indexOf(endMarker, start);
  assert.ok(end > start, `${endMarker} must follow ${startMarker}`);
  return source.slice(start, end);
}

test("optimistic concurrency stays on, because credit writes depend on it", () => {
  // The fix below must never be "turn the version check off". Two concurrent
  // credit writes silently overwriting each other is a wallet that loses money.
  assert.match(userBillingModel, /optimisticConcurrency:\s*true/);
});

test("the geo observation is not written through save()", () => {
  // save() takes the version check. This write is a per-request observation, not
  // a read-modify-write of prior state, so it must not compete for the version.
  const body = bodyOf(db, "export async function resolveUserPricingContext", "export async function updateLegacyUserCredits");
  assert.doesNotMatch(
    body,
    /await billing\.save\(/,
    "resolveUserPricingContext must not save() - it runs on every billing read",
  );
  assert.match(body, /UserBilling\.updateOne\(/);
  assert.match(body, /pricingRiskFlags: billing\.pricingRiskFlags/);
});

test("every field the resolver mutates is also persisted", () => {
  // A field mutated in memory but left out of the $set would be correct for the
  // life of the request and silently lost afterwards - the worst kind of bug to
  // find, because the response looks right.
  const body = bodyOf(db, "export async function resolveUserPricingContext", "export async function updateLegacyUserCredits");
  const mutated = [...body.matchAll(/\bbilling\.(pricing[A-Za-z]+)\s*=/g)].map((m) => m[1]);
  assert.ok(mutated.length >= 6, `expected several mutated pricing fields, saw ${mutated.length}`);

  const persisted = bodyOf(body, "UserBilling.updateOne(", "{ session }");
  for (const field of new Set(mutated)) {
    assert.match(persisted, new RegExp(`\\b${field}:`), `${field} is mutated but never persisted`);
  }
});

test("a concurrent first-ever billing row is read back rather than thrown", () => {
  // UserBilling.user is unique. Two concurrent upserts for a brand-new customer
  // both match nothing and both insert; Mongo rejects one with E11000. The
  // loser's row exists by definition, so the duplicate key is the answer, not a
  // failure.
  const start = db.indexOf("export async function ensureUserBilling");
  const body = db.slice(start, db.indexOf("export async function", start + 40));
  assert.match(body, /code\?\: number \}\)\?\.code !== 11000/);
  assert.match(body, /UserBilling\.findOne\(\{ user: user\._id \}\)/);
});
