import { NextRequest, NextResponse } from "next/server";
import type SessionModel from "@/models/session";
import { classifyRefreshFailure, refreshGoogleToken } from "@/lib/token";
import {
  SESSION_ABSOLUTE_LIFETIME_MS,
  SESSION_MAX_LIFETIME_MS,
  sessionExpiryFilter,
} from "@/lib/auth-session";

interface SessionDoc {
  _id: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  createdAt?: Date;
}

function requiresReauth(message: string) {
  return NextResponse.json(
    { error: message, requiresReauth: true },
    { status: 401 },
  );
}

/**
 * The refresh could not be completed, but the session is not known to be dead.
 *
 * Every failure in this handler used to return the 401 above, so a DNS blip, a
 * Google 5xx and a genuinely revoked grant were indistinguishable to the
 * client — and the plugin, reasonably, treats `requiresReauth` as "wipe the
 * stored session". A transient outage therefore signed users out permanently.
 * The explicit `requiresReauth: false` lets a client retry instead.
 */
function temporarilyUnavailable(message: string) {
  return NextResponse.json(
    { error: message, requiresReauth: false, retryable: true },
    { status: 503 },
  );
}

/**
 * The handler's collaborators, injectable so its decision table can be tested.
 *
 * This logic lives in lib/ rather than in the route file because a Next.js
 * route module may export only route handlers — and with it inline, nothing
 * could load it: reverting the outcome mapping to the single pre-fix
 * `requiresReauth(...)` line left the entire suite green, since every test
 * reached only lib/. The bug this code exists to fix lived here, so this is
 * what has to be exercised.
 */
export interface RefreshDeps {
  connect: () => Promise<unknown>;
  sessions: Pick<typeof SessionModel, "findOne" | "updateOne">;
  refresh: typeof refreshGoogleToken;
}

/**
 * Resolved lazily rather than imported at module scope.
 *
 * lib/db.ts throws on load when MONGODB_URI is unset and carries a `server-only`
 * guard, so importing it eagerly would make this module unloadable in a test
 * process — which is how the handler ended up with no coverage at all.
 */
async function resolveDefaultDeps(): Promise<RefreshDeps> {
  const [{ default: dbConnect }, { default: Session }] = await Promise.all([
    import("@/lib/db"),
    import("@/models/session"),
  ]);
  return { connect: dbConnect, sessions: Session, refresh: refreshGoogleToken };
}

export async function handleRefresh(
  request: NextRequest,
  injectedDeps?: RefreshDeps,
) {
  try {
    const { connect, sessions, refresh } =
      injectedDeps ?? (await resolveDefaultDeps());
    const body = await request.json().catch(() => ({}));
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";

    if (!accessToken) {
      return requiresReauth("Missing access token.");
    }

    await connect();
    const now = new Date();
    const session = (await sessions.findOne({
      accessToken,
      completed: true,
      user: { $exists: true, $ne: null },
      ...sessionExpiryFilter(now),
    }).lean()) as SessionDoc | null;

    if (!session?.accessToken) {
      // Genuinely indistinguishable from a revoked session at this point: the
      // token we were given matches no live session document.
      return requiresReauth("Session not found or expired.");
    }

    const refreshBufferMs = 5 * 60 * 1000;
    const expiresAt = session.accessTokenExpiresAt;
    if (!expiresAt) {
      return requiresReauth("Token expiry is unavailable.");
    }

    if (Date.now() <= expiresAt - refreshBufferMs) {
      return NextResponse.json({
        accessToken: session.accessToken,
        refreshed: false,
        expiresAt,
      });
    }

    if (!session.refreshToken) {
      return requiresReauth("Token refresh is unavailable.");
    }

    try {
      const refreshedTokens = await refresh(session.refreshToken);
      const newAccessToken = refreshedTokens.access_token;
      const newExpiresAt = Date.now() + refreshedTokens.expires_in * 1000;
      const updateFields: Record<string, unknown> = {
        accessToken: newAccessToken,
        accessTokenExpiresAt: newExpiresAt,
      };

      if (refreshedTokens.refresh_token) {
        updateFields.refreshToken = refreshedTokens.refresh_token;
      }

      // A session that is actively refreshing is a session in use, so its
      // deadline moves with it. Without this the window set at sign-in was
      // never renewed anywhere, which logged every user out exactly 30 days
      // after signing in no matter how much they used the product. Documents
      // predating this field get one written here, which heals them on first
      // use rather than needing a migration.
      //
      // Capped at SESSION_MAX_LIFETIME_MS from creation: renewal without a
      // ceiling would mean a stolen token stays valid forever, since polling
      // this endpoint is itself what extends it and nothing else can end a
      // session on demand.
      const createdAtMs = session.createdAt
        ? new Date(session.createdAt).getTime()
        : Date.now();
      updateFields.expiresAt = new Date(
        Math.min(
          Date.now() + SESSION_ABSOLUTE_LIFETIME_MS,
          createdAtMs + SESSION_MAX_LIFETIME_MS,
        ),
      );

      const updated = await sessions.updateOne(
        {
          _id: session._id,
          accessToken,
          completed: true,
          ...sessionExpiryFilter(new Date()),
        },
        { $set: updateFields },
      );

      // matchedCount, not modifiedCount: if Google hands back the same access
      // token, nothing changes and modifiedCount is 0 while the session is
      // perfectly healthy. That alone would have forced a needless re-auth.
      if (updated.matchedCount !== 1) {
        // The filter pins the old accessToken, so a concurrent refresh that
        // rotated it first lands here. That is a race we won, late — not a
        // dead session. Serve whatever the winner stored.
        const current = (await sessions.findOne({
          _id: session._id,
          completed: true,
          ...sessionExpiryFilter(new Date()),
        }).lean()) as SessionDoc | null;

        if (current?.accessToken && current.accessTokenExpiresAt) {
          return NextResponse.json({
            accessToken: current.accessToken,
            refreshed: true,
            expiresAt: current.accessTokenExpiresAt,
          });
        }

        return temporarilyUnavailable("Session was updated concurrently. Please retry.");
      }

      return NextResponse.json({
        accessToken: newAccessToken,
        refreshed: true,
        expiresAt: newExpiresAt,
      });
    } catch (refreshError) {
      const failure = classifyRefreshFailure(refreshError);
      console.error(
        `Google token refresh failed (kind=${failure.kind}, googleError=${failure.googleError ?? "none"}, upstreamStatus=${failure.upstreamStatus ?? "none"}):`,
        failure.message,
      );

      if (failure.kind === "revoked") {
        return requiresReauth("Your session is no longer valid. Please sign in again.");
      }

      // Includes "misconfigured": if our own OAuth client credentials are
      // wrong, signing the entire user base out does not fix it and cannot be
      // undone.
      return temporarilyUnavailable("Could not refresh authentication right now. Please retry.");
    }
  } catch (error) {
    console.error("Error in /api/auth/refresh:", error);
    return NextResponse.json({ error: "Unable to refresh authentication." }, { status: 500 });
  }
}
