/**
 * The links that carry a discount code.
 *
 * A link that drops its code does not fail — it charges the customer full price
 * while the modal that produced it promised a discount. That is the failure
 * mode these tests exist for, and it is silent by nature.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "@/app/claim/[code]/route";

function claim(path: string) {
  // A real NextRequest: the route reads `nextUrl`, which a plain Request lacks.
  return GET(new NextRequest(`https://www.waysorted.com${path}`), {
    params: Promise.resolve({ code: path.split("/")[2].split("?")[0] }),
  });
}

function locationOf(response: Response) {
  return new URL(response.headers.get("location") || "");
}

test("a bare claim link carries the code to billing", async () => {
  const response = await claim("/claim/BOOST20");
  assert.equal(response.status, 307);
  const url = locationOf(response);
  assert.equal(url.pathname, "/billing");
  assert.equal(url.searchParams.get("coupon"), "BOOST20");
});

test("codes are normalised, so a lowercase link still works", async () => {
  const url = locationOf(await claim("/claim/boost20"));
  assert.equal(url.searchParams.get("coupon"), "BOOST20");
});

test("a plan and autostart are carried through", async () => {
  const url = locationOf(await claim("/claim/UNLOCK30?product=sub_month_2&autostart=1"));
  assert.equal(url.searchParams.get("coupon"), "UNLOCK30");
  assert.equal(url.searchParams.get("product"), "sub_month_2");
  assert.equal(url.searchParams.get("autostart"), "1");
});

test("only known parameters are forwarded", async () => {
  // Forwarding everything would let a crafted link set the price fields the
  // checkout quote guard compares against.
  const url = locationOf(await claim("/claim/BOOST20?product=sub_month_1&evil=1&redirect=http://x"));
  assert.equal(url.searchParams.get("product"), "sub_month_1");
  assert.equal(url.searchParams.get("evil"), null);
  assert.equal(url.searchParams.get("redirect"), null);
});

test("a malformed code is dropped rather than reflected", async () => {
  for (const bad of ["/claim/" + "A".repeat(80), "/claim/%3Cscript%3E"]) {
    const url = locationOf(await claim(bad));
    assert.equal(url.pathname, "/billing");
    assert.equal(url.searchParams.get("coupon"), null, `${bad} must not be forwarded`);
  }
});

test("the redirect stays on our own origin", async () => {
  // The destination is built from the request origin, never from user input, so
  // a claim link cannot be turned into an open redirect.
  const url = locationOf(await claim("/claim/BOOST20?product=sub_month_1"));
  assert.equal(url.origin, "https://www.waysorted.com");
});

test("all four live codes produce a valid link", async () => {
  for (const code of ["WELCOME15", "BOOST20", "TOPUP25", "UNLOCK30"]) {
    const url = locationOf(await claim(`/claim/${code}`));
    assert.equal(url.searchParams.get("coupon"), code);
  }
});
