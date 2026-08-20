/**
 * The shape check that guards every entry point a code can arrive through.
 *
 * These inputs are attacker-controlled: a /claim URL segment, a JSON body field
 * on the plugin's checkout bridge, and a text field on the checkout page. What
 * matters here is not that valid codes pass - it is that nothing else does, and
 * that a rejection is a null rather than a coerced string.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { isCouponCodeShape, normalizeCouponCode } from "@/lib/billing/coupon-code";

test("the four live codes are accepted", () => {
  for (const code of ["WELCOME15", "BOOST20", "TOPUP25", "UNLOCK30"]) {
    assert.equal(normalizeCouponCode(code), code);
  }
});

test("case is folded, because a correctly-copied code gets typed in every case", () => {
  assert.equal(normalizeCouponCode("boost20"), "BOOST20");
  assert.equal(normalizeCouponCode("Boost20"), "BOOST20");
  assert.equal(normalizeCouponCode("  boost20  "), "BOOST20", "whitespace from a paste is trimmed");
});

test("separators are allowed after the first character", () => {
  assert.equal(normalizeCouponCode("SUMMER-25"), "SUMMER-25");
  assert.equal(normalizeCouponCode("PARTNER_ACME"), "PARTNER_ACME");
  assert.equal(normalizeCouponCode("-LEADING"), null, "a separator cannot start a code");
  assert.equal(normalizeCouponCode("_LEADING"), null);
});

test("non-strings are refused rather than coerced", () => {
  // These arrive as parsed JSON from a request body. String({}) is
  // "[object Object]", which is exactly the kind of value that should never
  // reach a database field or a redirect.
  for (const value of [null, undefined, 42, true, {}, [], { code: "BOOST20" }, ["BOOST20"]]) {
    assert.equal(normalizeCouponCode(value), null, `${JSON.stringify(value)} is not a code`);
  }
});

test("length is bounded at both ends", () => {
  assert.equal(normalizeCouponCode("A"), null, "one character is not a code");
  assert.equal(normalizeCouponCode("AB"), "AB", "two is the minimum");
  assert.equal(normalizeCouponCode("A".repeat(32)), "A".repeat(32), "32 is the maximum");
  assert.equal(normalizeCouponCode("A".repeat(33)), null);
  assert.equal(normalizeCouponCode("A".repeat(5000)), null, "no unbounded string gets through");
});

test("nothing that could change the meaning of a URL survives", () => {
  // A code is reflected into a redirect and into query parameters. Anything
  // here reaching that URL would let a crafted link add or override parameters.
  for (const bad of [
    "BOOST20&autostart=1",
    "BOOST20?product=x",
    "BOOST20#frag",
    "BOOST20/../admin",
    "BOOST20 OR 1=1",
    "../../etc/passwd",
    "//evil.com",
    "<script>alert(1)</script>",
    "BOOST20%00",
    "BOOST20\nSet-Cookie: x=y",
    "BOOST20\r\nLocation: http://evil",
    "",
    "   ",
  ]) {
    assert.equal(normalizeCouponCode(bad), null, `${JSON.stringify(bad)} must be refused`);
  }
});

test("unicode look-alikes do not become a different code", () => {
  // Cyrillic О and Latin O render identically. Folding case must not smuggle one
  // in as the other.
  assert.equal(normalizeCouponCode("BOOST20".replace("O", "О")), null);
  assert.equal(normalizeCouponCode("BOOST​20"), null, "a zero-width space is not a separator");
  assert.equal(normalizeCouponCode("ＢＯＯＳＴ２０"), null, "full-width characters are not the code");
});

test("isCouponCodeShape agrees with normalizeCouponCode", () => {
  for (const value of ["BOOST20", "boost20", "-X", "", 42, null, "A".repeat(40)]) {
    assert.equal(
      isCouponCodeShape(value),
      normalizeCouponCode(value) !== null,
      `${JSON.stringify(value)} must not disagree between the two`,
    );
  }
});
