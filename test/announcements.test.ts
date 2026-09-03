import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildAnnouncements, describeOffer } from "../lib/announcements";
import { COUPON_MAX_CREDITS } from "../lib/billing/coupon";

test("the banner still has something to say with no live coupons", () => {
  const entries = buildAnnouncements([]);
  assert.ok(entries.length >= 2, "needs at least two lines to rotate at all");
  for (const entry of entries) {
    assert.ok(entry.text.trim().length > 0);
    assert.ok(entry.ctaLabel.trim().length > 0);
    assert.ok(entry.href.startsWith("/"), `${entry.href} should be an internal route`);
  }
});

test("no line is longer than the one already shipping", () => {
  /*
   * All eleven consumers of useBanner hardcode the page offset as `pt-24` while
   * the banner is open. Copy that wraps to a second line on a phone makes the
   * banner taller than that offset and pushes content under the fixed header on
   * every one of them.
   *
   * The Palettable line has shipped at 71 characters including its CTA, so that
   * is the demonstrated budget. Nothing new may exceed it.
   */
  const BUDGET = 71;
  const entries = buildAnnouncements([
    { code: "WELCOME15", percent: 15, maxCredits: null },
    { code: "BOOST20", percent: 20, maxCredits: 50 },
    { code: "TOPUP25", percent: 25, maxCredits: 25 },
    { code: "UNLOCK30", percent: 30, maxCredits: 0 },
  ]);
  for (const entry of entries) {
    const rendered = `${entry.text} ${entry.ctaLabel}`;
    assert.ok(
      rendered.length <= BUDGET,
      `"${rendered}" is ${rendered.length} chars, over the ${BUDGET} budget`,
    );
  }
});

test("a threshold is described as a ceiling on balance, not a spend target", () => {
  const entry = describeOffer({ code: "TOPUP25", percent: 25, maxCredits: 25 });
  assert.ok(entry);
  // "Down to 25 credits" - you qualify when your balance has FALLEN to it.
  assert.match(entry.text, /Down to 25 credits/);
  assert.match(entry.text, /25% off/);
  // The inversion that got this copy deleted from checkout in the first place.
  assert.doesNotMatch(entry.text, /spend/i);
});

test("a zero ceiling reads as exhausted, not as spending zero", () => {
  const entry = describeOffer({ code: "UNLOCK30", percent: 30, maxCredits: 0 });
  assert.ok(entry);
  assert.match(entry.text, /Out of credits/);
  assert.doesNotMatch(entry.text, /Down to 0 credits/);
});

test("an uncapped coupon is not described as a low-balance offer", () => {
  const entry = describeOffer({ code: "WELCOME15", percent: 15, maxCredits: null });
  assert.ok(entry);
  assert.match(entry.text, /New here\?/);
  assert.doesNotMatch(entry.text, /Down to/);
});

test("no announcement invents a credit number the coupon ladder does not hold", () => {
  const thresholds = new Set(
    Object.values(COUPON_MAX_CREDITS).filter((value) => Number.isFinite(value)),
  );
  const entries = buildAnnouncements([
    { code: "BOOST20", percent: 20, maxCredits: 50 },
    { code: "TOPUP25", percent: 25, maxCredits: 25 },
  ]);
  for (const entry of entries) {
    const match = entry.text.match(/Down to (\d+) credits/);
    if (!match) continue;
    assert.ok(
      thresholds.has(Number(match[1])),
      `${match[1]} is not a real coupon ceiling`,
    );
  }
});

test("deeper discounts come round before shallower ones", () => {
  const entries = buildAnnouncements([
    { code: "BOOST20", percent: 20, maxCredits: 50 },
    { code: "UNLOCK30", percent: 30, maxCredits: 0 },
  ]);
  const offerLines = entries.filter((entry) => entry.id.startsWith("offer-"));
  assert.deepEqual(offerLines.map((entry) => entry.id), ["offer-UNLOCK30", "offer-BOOST20"]);
});

test("the header no longer carries the banner copy itself", () => {
  const header = readFileSync(new URL("../components/Header/index.tsx", import.meta.url), "utf8");
  // The literal that made the banner "stuck on this CTA only".
  assert.doesNotMatch(header, /Try Palettable for quick Color schemes/);
  assert.match(header, /buildAnnouncements/);
});

test("the resurrected untruth stays dead", () => {
  // "Spend 30 credits and a discount code unlocks automatically" was removed from
  // checkout for being false. It must not reappear via the banner either.
  const sources = [
    "../lib/announcements.ts",
    "../components/Header/index.tsx",
  ].map((rel) => readFileSync(new URL(rel, import.meta.url), "utf8"));
  for (const source of sources) {
    assert.doesNotMatch(source, /Spend \d+ credits/i);
  }
});
