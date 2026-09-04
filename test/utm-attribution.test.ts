import assert from "node:assert/strict";
import test from "node:test";
import Purchase from "../models/purchase";
import AttributionVisit from "../models/attributionVisit";
import {
  UTM_ATTRIBUTION_STORAGE_KEY,
  UTM_ATTRIBUTION_TTL_MS,
  attributionFromSearchParams,
  attributionLandingPath,
  buildAttributionOpenPayload,
  getOrCreateAttributionVisitorId,
  normalizeUtmAttribution,
  readStoredUtmAttribution,
} from "../lib/utm-attribution";

test("standard UTM query parameters become normalized checkout attribution", () => {
  const attribution = attributionFromSearchParams(
    new URLSearchParams(
      "utm_source=%20madhura%20&utm_medium=referral&utm_campaign=checkout&utm_content=story",
    ),
    "/payment?utm_source=madhura",
    "2026-09-03T10:00:00.000Z",
  );

  assert.deepEqual(attribution, {
    utmSource: "madhura",
    utmMedium: "referral",
    utmCampaign: "checkout",
    utmTerm: undefined,
    utmContent: "story",
    landingPath: "/payment?utm_source=madhura",
    capturedAt: "2026-09-03T10:00:00.000Z",
  });
});

test("attribution rejects missing sources and strips control characters", () => {
  assert.equal(normalizeUtmAttribution({ utmCampaign: "checkout" }), null);
  assert.equal(
    normalizeUtmAttribution({ utmSource: "mad\u0000hura" })?.utmSource,
    "madhura",
  );
});

test("recorded landing paths keep UTM values but omit unrelated query data", () => {
  const path = attributionLandingPath(
    "/payment",
    new URLSearchParams("utm_source=madhura&utm_campaign=checkout&email=person%40example.com"),
  );
  assert.equal(path, "/payment?utm_source=madhura&utm_campaign=checkout");
  assert.equal(path.includes("email"), false);
});

test("stored attribution expires after thirty days", () => {
  const now = Date.parse("2026-09-03T10:00:00.000Z");
  const values = new Map<string, string>();
  let removed = false;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => {
      removed = true;
      values.delete(key);
    },
  };
  values.set(UTM_ATTRIBUTION_STORAGE_KEY, JSON.stringify({
    utmSource: "madhura",
    capturedAt: new Date(now - UTM_ATTRIBUTION_TTL_MS - 1).toISOString(),
  }));

  assert.equal(readStoredUtmAttribution(storage, now), null);
  assert.equal(removed, true);
});

test("purchases index UTM source for admin attribution reports", () => {
  assert.ok(Purchase.schema.indexes().some(([fields]) =>
    fields["attribution.utmSource"] === 1 && fields.createdAt === -1,
  ));
});

test("an untagged purchase does not materialize an empty attribution object", () => {
  const purchase = new Purchase({
    user: "507f1f77bcf86cd799439011",
    productCode: "topup",
    kind: "topup",
    amountPaise: 100,
    currency: "INR",
    creditsGranted: 1,
    bonusCredits: 0,
    receipt: "utm_schema_test",
    grantApplied: false,
    refundedAmountPaise: 0,
    refundedCreditsApplied: 0,
    idempotencyKey: "utm-schema-test",
  });

  assert.equal(purchase.toObject().attribution, undefined);
});

test("one browser keeps a stable anonymous attribution visitor id", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  const generated = "01890f47-2d9a-7b56-8abc-1234567890ab";
  assert.equal(getOrCreateAttributionVisitorId(storage, () => generated), generated);
  assert.equal(
    getOrCreateAttributionVisitorId(storage, () => "01890f47-2d9a-7b56-8abc-999999999999"),
    generated,
  );
});

test("a page load produces an idempotent open event without personal data", () => {
  const attribution = attributionFromSearchParams(
    new URLSearchParams("utm_source=madhura&utm_medium=referral&utm_campaign=checkout"),
    "/payment?utm_source=madhura",
    "2026-09-04T10:00:00.000Z",
  );
  assert.ok(attribution);
  const visitorId = "01890f47-2d9a-7b56-8abc-1234567890ab";
  const payload = buildAttributionOpenPayload(attribution, visitorId, "1788506400123");
  assert.deepEqual(payload, {
    eventId: `${visitorId}:1788506400123`,
    visitorId,
    attribution: { ...attribution, visitorId },
  });
  assert.equal("email" in (payload || {}), false);
});

test("attribution visits index campaign opens for dashboard reporting", () => {
  assert.ok(AttributionVisit.schema.indexes().some(([fields]) =>
    fields.utmSource === 1 && fields.utmCampaign === 1 && fields.openedAt === -1,
  ));
});
