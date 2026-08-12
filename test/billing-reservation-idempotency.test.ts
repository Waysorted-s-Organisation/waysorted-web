import assert from "node:assert/strict";
import test from "node:test";
import { assertReservationReplayAllowed } from "../lib/billing/reservation-idempotency";
import UsageReservation from "../models/usageReservation";

const original = {
  status: "reserved" as const,
  featureCode: "import_pdf",
  toolCode: "file_importer",
  sizeBucket: "small",
  creditsReserved: 10,
  processor: "pdf-to-svg",
  selectedOptions: { quality: "high", pages: 2 },
  expiresAt: new Date(Date.now() + 60_000),
};

const requested = {
  featureCode: "import_pdf",
  toolCode: "file_importer",
  sizeBucket: "small",
  creditsRequired: 10,
  processor: "pdf-to-svg",
  selectedOptions: { pages: 2, quality: "high" },
};

test("an identical in-flight reservation can be replayed", () => {
  assert.doesNotThrow(() => assertReservationReplayAllowed(original, requested));
});

for (const status of ["committed", "released", "expired", "compensated"] as const) {
  test(`a ${status} reservation cannot be replayed`, () => {
    assert.throws(
      () => assertReservationReplayAllowed({ ...original, status }, requested),
      (error: unknown) =>
        error instanceof Error &&
        (error as Error & { status?: number }).status === 409,
    );
  });
}

test("the same key cannot be reused with changed reservation inputs", () => {
  assert.throws(
    () => assertReservationReplayAllowed(original, { ...requested, creditsRequired: 30 }),
    /different reservation request/,
  );
});

test("the same key cannot be reused with changed processor options", () => {
  assert.throws(
    () => assertReservationReplayAllowed(original, {
      ...requested,
      selectedOptions: { pages: 4, quality: "high" },
    }),
    /different reservation request/,
  );
});

test("a stale reserved record cannot be replayed before the expiry sweep finishes", () => {
  assert.throws(
    () => assertReservationReplayAllowed(
      { ...original, expiresAt: new Date(Date.now() - 1) },
      requested,
    ),
    /expired reservation/,
  );
});

test("the schema uses a user-scoped compound unique index", () => {
  const index = UsageReservation.schema.indexes().find(
    ([fields]) => fields.user === 1 && fields.idempotencyKey === 1,
  );
  assert.ok(index);
  assert.equal(index[1]?.unique, true);
  assert.equal(
    UsageReservation.schema.indexes().some(([fields]) =>
      Object.keys(fields).length === 1 && fields.idempotencyKey === 1
    ),
    false,
  );
});
