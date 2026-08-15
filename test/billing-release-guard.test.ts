import assert from "node:assert/strict";
import test from "node:test";

/**
 * A customer must not be able to free a credit hold the processor has already accepted: the job is
 * in flight, so releasing it returns the credits while the work is still delivered, and the later
 * completion callback has nothing left to charge against.
 *
 * The first version of this guard read `metadata.processorStatus`, which /api/billing/usage/
 * plugin-status lets any session-authenticated user overwrite. Two calls - report "failed", then
 * release - returned the credits on every job. The guard now reads a monotonic marker that only the
 * HMAC-verified processor callback can set and nothing can clear.
 *
 * These cases pin the decision rules directly; the surrounding functions require a live database.
 */

/** Mirrors the guard in releaseReservation (lib/billing/db.ts). */
function userReleaseBlocked(metadata: Record<string, unknown>) {
  return Boolean(metadata.processorAcceptedAt) || metadata.processorStatus === "accepted";
}

/** Mirrors the plugin-report branch of recordProcessorReservationStatus. */
function applyReport(
  metadata: Record<string, unknown>,
  input: { status: "accepted" | "completed" | "failed"; origin: "plugin" | "processor" },
): Record<string, unknown> {
  const alreadyAccepted =
    metadata.processorStatus === "accepted" || Boolean(metadata.processorAcceptedAt);

  if (input.origin === "plugin" && alreadyAccepted && input.status !== "accepted") {
    return { ...metadata, pluginReportedStatus: input.status };
  }

  return {
    ...metadata,
    processorStatus: input.status,
    processorAcceptedAt:
      input.status === "accepted"
        ? metadata.processorAcceptedAt || "2026-08-14T10:00:00.000Z"
        : metadata.processorAcceptedAt || null,
  };
}

test("a user cannot release a hold the processor accepted", () => {
  const accepted = applyReport({}, { status: "accepted", origin: "processor" });
  assert.equal(userReleaseBlocked(accepted), true);
});

test("a plugin report of failed cannot clear a processor acceptance", () => {
  // The exact bypass: accept, then self-report "failed", then release.
  let metadata = applyReport({}, { status: "accepted", origin: "processor" });
  metadata = applyReport(metadata, { status: "failed", origin: "plugin" });

  assert.equal(metadata.pluginReportedStatus, "failed", "the plugin claim is still recorded");
  assert.equal(metadata.processorStatus, "accepted", "but it must not overwrite the real status");
  assert.equal(userReleaseBlocked(metadata), true, "release must stay blocked");
});

test("a plugin report of completed also cannot clear the acceptance", () => {
  let metadata = applyReport({}, { status: "accepted", origin: "processor" });
  metadata = applyReport(metadata, { status: "completed", origin: "plugin" });
  assert.equal(userReleaseBlocked(metadata), true);
});

test("the processor itself may move the job on, and the marker survives", () => {
  let metadata = applyReport({}, { status: "accepted", origin: "processor" });
  metadata = applyReport(metadata, { status: "completed", origin: "processor" });

  assert.equal(metadata.processorStatus, "completed");
  // Monotonic: never cleared, so a late user release still cannot free the hold.
  assert.ok(metadata.processorAcceptedAt);
  assert.equal(userReleaseBlocked(metadata), true);
});

test("a hold no processor ever touched stays user-cancellable", () => {
  assert.equal(userReleaseBlocked({}), false);
  const reported = applyReport({}, { status: "failed", origin: "plugin" });
  assert.equal(userReleaseBlocked(reported), false);
});
