import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import Purchase from "../models/purchase";
import Refund from "../models/refund";
import RazorpayEventLog from "../models/razorpayEventLog";
import { buildCorsHeaders, resolveCorsOrigin } from "../lib/cors";

test("purchase idempotency is unique within a user, not globally", () => {
  const indexes = Purchase.schema.indexes();
  assert.ok(indexes.some(([fields, options]) =>
    fields.user === 1 &&
    fields.idempotencyKey === 1 &&
    options.unique === true,
  ));
  const path = Purchase.schema.path("idempotencyKey");
  assert.notEqual((path.options as { unique?: boolean }).unique, true);
});

test("provider refund identity has a sparse unique index", () => {
  const indexes = Refund.schema.indexes();
  assert.ok(indexes.some(([fields, options]) =>
    fields.providerRefundId === 1 &&
    options.unique === true &&
    options.sparse === true,
  ));
});

test("webhook audit records expire after 180 days", () => {
  const indexes = RazorpayEventLog.schema.indexes();
  assert.ok(indexes.some(([fields, options]) =>
    fields.createdAt === 1 &&
    options.expireAfterSeconds === 60 * 60 * 24 * 180,
  ));
});

test("opaque plugin origins are allowed without credentialed cookies", () => {
  const request = { headers: new Headers({ origin: "null" }) };
  assert.equal(resolveCorsOrigin(request as never), "null");
  const headers = buildCorsHeaders(request as never);
  assert.equal(headers?.["Access-Control-Allow-Origin"], "null");
  assert.equal("Access-Control-Allow-Credentials" in (headers || {}), false);
});

test("a quote only warns about the product it was actually quoted for", () => {
  /*
   * quoteDrift used to compare the URL's qa= against whatever plan was selected,
   * so changing plan in the dropdown tripped the guard: arriving from Pro
   * (qa=74900) and choosing Discover produced "You were shown ₹749.00. Based on
   * your account it is now ₹149.00." - blaming the customer's account, in the
   * register reserved for a genuine price drift, for a change they made.
   */
  const source = readFileSync(new URL("../app/billing/billing-client.tsx", import.meta.url), "utf8");
  const fn = source.slice(source.indexOf("const quoteDrift = useMemo("));
  const body = fn.slice(0, fn.indexOf("}, ["));
  assert.match(body, /selectedProduct\.code !== initialProductCode/);
  assert.ok(
    body.indexOf("initialProductCode") < body.indexOf("sameAmount"),
    "the product check must gate the amount comparison, not follow it",
  );
});

test("the subscription panel only shows while a subscription is live", () => {
  // status !== "inactive" let every terminal state through, so a cancelled
  // subscriber saw a panel reading `cancelled` with no action on it.
  const source = readFileSync(new URL("../app/billing/billing-client.tsx", import.meta.url), "utf8");
  assert.match(source, /shouldShowSubscriptionPanel[\s\S]{0,240}isLiveSubscriptionStatus/);
  assert.doesNotMatch(source, /subscription\.status !== "inactive"/);
  // and it renders the human label, not the database enum
  assert.match(source, /snapshot\?\.billing\.subscription\.statusLabel \|\| "NA"/);
});
