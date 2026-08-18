import assert from "node:assert/strict";
import test from "node:test";
import sift from "sift";
import {
  RESERVATION_HARD_RECLAIM_MS,
  buildStaleReservationFilter,
} from "../lib/billing/reservation-sweep";

/**
 * The sweep decides whether a paying customer's stranded credits come back to them, and whether a
 * live job gets billed or silently freed. Both directions cost real money, so the selection rules
 * are evaluated against representative documents rather than asserted structurally.
 */
const NOW = new Date("2026-08-14T12:00:00Z");
const HOUR = 60 * 60_000;

function matches(doc: Record<string, unknown>) {
  const filter = buildStaleReservationFilter({ now: NOW });
  // Flatten the dotted metadata key the way MongoDB resolves it.
  const flattened: Record<string, unknown> = { ...doc };
  const metadata = doc.metadata as Record<string, unknown> | undefined;
  flattened["metadata.processorStatus"] = metadata?.processorStatus;
  return sift(filter as never)(flattened);
}

function reservation(overrides: Record<string, unknown> = {}) {
  return {
    status: "reserved",
    expiresAt: new Date(NOW.getTime() - HOUR),
    createdAt: new Date(NOW.getTime() - HOUR),
    metadata: {},
    ...overrides,
  };
}

test("reclaims a lapsed hold that no processor ever claimed", () => {
  assert.equal(matches(reservation()), true);
});

test("never reclaims a hold whose lease has not lapsed", () => {
  assert.equal(
    matches(reservation({ expiresAt: new Date(NOW.getTime() + HOUR) })),
    false,
  );
});

test("never reclaims a live job a processor keeps extending", () => {
  // recordProcessorReservationStatus pushes expiresAt forward on every accept; a long-running job
  // must not have its credits released out from under it, however old the reservation is.
  assert.equal(
    matches(
      reservation({
        expiresAt: new Date(NOW.getTime() + 5 * 60_000),
        createdAt: new Date(NOW.getTime() - 12 * HOUR),
        metadata: { processorStatus: "accepted" },
      }),
    ),
    false,
  );
});

test("does not reclaim an accepted job whose lease just lapsed", () => {
  // Gives a briefly-stalled processor room to finish rather than freeing the work immediately.
  assert.equal(
    matches(
      reservation({
        expiresAt: new Date(NOW.getTime() - 60_000),
        createdAt: new Date(NOW.getTime() - 10 * 60_000),
        metadata: { processorStatus: "accepted" },
      }),
    ),
    false,
  );
});

test("reclaims an accepted job abandoned past the hard deadline", () => {
  // Regression: these were excluded from the sweep forever, permanently stranding paid credits
  // whenever a processor accepted a job and then crashed.
  assert.equal(
    matches(
      reservation({
        expiresAt: new Date(NOW.getTime() - HOUR),
        createdAt: new Date(NOW.getTime() - RESERVATION_HARD_RECLAIM_MS - HOUR),
        metadata: { processorStatus: "accepted" },
      }),
    ),
    true,
  );
});

test("only considers reservations still holding credits", () => {
  for (const status of ["committed", "released", "expired"]) {
    assert.equal(matches(reservation({ status })), false, `status ${status} must be ignored`);
  }
});

test("scopes to a single user when a userId is supplied", () => {
  const scoped = buildStaleReservationFilter({ now: NOW, userId: "user_1" }) as {
    user?: string;
  };
  const unscoped = buildStaleReservationFilter({ now: NOW }) as { user?: string };
  assert.equal(scoped.user, "user_1");
  assert.equal("user" in unscoped, false);
});
