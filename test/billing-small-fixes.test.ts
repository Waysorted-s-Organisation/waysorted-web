import assert from "node:assert/strict";
import test from "node:test";
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
