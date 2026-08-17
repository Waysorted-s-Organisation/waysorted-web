/**
 * Gives legacy session documents the deadline they were never issued.
 *
 * `Session.expiresAt` is written at sign-in and, before the change in
 * app/api/auth/refresh/route.ts, was never renewed. Documents created before
 * that field existed have no `expiresAt` at all, so `sessionExpiryFilter`
 * falls back to `createdAt > now - 30 days` — which means every one of them
 * older than 30 days is permanently unrefreshable, regardless of whether its
 * Google refresh token still works. Those users are signed out and cannot get
 * back in without a full re-authentication.
 *
 * The refresh route now writes `expiresAt` on every successful refresh, so
 * sessions still inside the fallback window heal themselves on next use. This
 * script exists for the ones already past it, which can never reach that code.
 *
 * READ-ONLY BY DEFAULT. Run without flags to see what would change:
 *
 *   npm run migrate:session-expiry
 *   npm run migrate:session-expiry -- --apply
 *
 * The --conditions=react-server flag in that script is required: lib/db.ts
 * carries a `server-only` guard that throws without it.
 *
 * Deliberately NOT run as part of any deploy. Reviving a session is a security
 * decision — it extends the life of a credential that was, by the current
 * rules, expired — and belongs to whoever owns this service, not to a script
 * that runs on its own.
 */
import dbConnect from "../lib/db";
import Session from "../models/session";
import { SESSION_ABSOLUTE_LIFETIME_MS } from "../lib/auth-session";

const APPLY = process.argv.includes("--apply");

/**
 * How long a revived session gets. Deliberately shorter than a fresh one: a
 * document that has been dormant past its window should not come back with the
 * full thirty days a real sign-in earns. Long enough that an active user is
 * carried through to their next refresh, which then renews it properly.
 */
const REVIVAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function main() {
  await dbConnect();

  const now = new Date();
  const fallbackCutoff = new Date(now.getTime() - SESSION_ABSOLUTE_LIFETIME_MS);

  const candidates = await Session.find({
    completed: true,
    user: { $exists: true, $ne: null },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
    createdAt: { $lte: fallbackCutoff },
    // Without a refresh token the session cannot be refreshed even with a
    // valid deadline, so reviving it would achieve nothing.
    refreshToken: { $exists: true, $ne: null },
  })
    .select({ _id: 1, sessionId: 1, createdAt: 1, source: 1, user: 1 })
    .lean();

  const bySource = new Map<string, number>();
  let oldest: Date | null = null;
  let newest: Date | null = null;
  for (const doc of candidates) {
    const source = doc.source || "(unset)";
    bySource.set(source, (bySource.get(source) || 0) + 1);
    const created = doc.createdAt ? new Date(doc.createdAt) : null;
    if (created) {
      if (!oldest || created < oldest) oldest = created;
      if (!newest || created > newest) newest = created;
    }
  }

  const distinctUsers = new Set(candidates.map((d) => String(d.user))).size;

  console.log(`Sessions with no expiresAt, past the ${SESSION_ABSOLUTE_LIFETIME_MS / 86400000}-day fallback,`);
  console.log(`still holding a refresh token: ${candidates.length} (${distinctUsers} distinct users)`);
  console.log(`  created between ${oldest?.toISOString() ?? "-"} and ${newest?.toISOString() ?? "-"}`);
  for (const [source, count] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  source=${source}`);
  }

  if (!candidates.length) {
    console.log("Nothing to do.");
    return;
  }

  if (!APPLY) {
    console.log(
      `\nDry run. Re-run with --apply to give each a ${REVIVAL_WINDOW_MS / 86400000}-day window;` +
        " their next successful refresh then renews it in full.",
    );
    return;
  }

  const revivedUntil = new Date(now.getTime() + REVIVAL_WINDOW_MS);
  // The expiresAt condition is repeated in the write, not just the read: a
  // session can refresh itself between the two, and the refresh route gives it
  // a full window. Without this, --apply would overwrite that with a shorter
  // one — turning a healthy session into an expiring one. It also makes the
  // script idempotent, since anything it already wrote no longer matches.
  const result = await Session.updateMany(
    {
      _id: { $in: candidates.map((d) => d._id) },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
    },
    { $set: { expiresAt: revivedUntil } },
  );

  console.log(`\nUpdated ${result.modifiedCount} sessions; they now expire ${revivedUntil.toISOString()}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
