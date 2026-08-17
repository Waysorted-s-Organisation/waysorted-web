/**
 * Exercises POST /api/auth/refresh itself.
 *
 * The classifier tests next door cover lib/token.ts, but nothing loaded the
 * route — so reverting its decision table to the single pre-fix
 * `requiresReauth(...)` line left every test green while restoring the defect
 * that signed users out. These tests drive the handler with a stubbed Session
 * model and a stubbed Google call, and assert the four outcomes that matter:
 *
 *   - only a revoked grant returns 401 requiresReauth
 *   - a transient upstream failure returns 503 with requiresReauth false
 *   - a lost rotation race serves the winner's token instead of forcing re-auth
 *   - the session deadline is renewed, and capped
 */
import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, AxiosHeaders } from "axios";
import { SESSION_ABSOLUTE_LIFETIME_MS, SESSION_MAX_LIFETIME_MS } from "@/lib/auth-session";
import { handleRefresh } from "@/lib/auth-refresh";

const CREATED_AT = new Date("2026-07-01T00:00:00Z");
const ACCESS_TOKEN = "stored-access-token";

type Doc = Record<string, any>;

/**
 * Builds the handler's collaborators. No module mocking: the handler takes its
 * dependencies as an argument precisely so a test can hand it fakes.
 */
function deps(options: {
  session: Doc | null;
  google?: () => Promise<any>;
  updateResult?: { matchedCount: number; modifiedCount: number };
  afterUpdate?: Doc | null;
}) {
  const updates: Doc[] = [];
  let findCall = 0;

  return {
    updates,
    deps: {
      connect: async () => undefined,
      sessions: {
        findOne: (_filter: Doc) => ({
          lean: async () => {
            findCall += 1;
            // The second findOne is the lost-race re-read.
            return findCall > 1 ? options.afterUpdate ?? null : options.session;
          },
        }),
        updateOne: async (_filter: Doc, update: Doc) => {
          updates.push(update.$set);
          return options.updateResult ?? { matchedCount: 1, modifiedCount: 1 };
        },
      },
      refresh:
        options.google ??
        (async () => ({ access_token: "new-access-token", expires_in: 3600 })),
    } as any,
  };
}

function request(body: unknown) {
  return { json: async () => body } as any;
}

function googleFailure(status: number | null, body: unknown): AxiosError {
  const error = new AxiosError("Request failed");
  if (status !== null) {
    error.response = {
      status,
      statusText: "",
      data: body,
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
  }
  return error;
}

const liveSession = (): Doc => ({
  _id: "sess-1",
  sessionId: "s1",
  accessToken: ACCESS_TOKEN,
  refreshToken: "refresh-1",
  // Already expired, so the early return is skipped and Google is called.
  accessTokenExpiresAt: Date.now() - 60_000,
  createdAt: CREATED_AT,
});

test("a revoked grant is the only thing that returns requiresReauth", async () => {
  const { deps: d } = deps({
    session: liveSession(),
    google: async () => {
      throw googleFailure(400, { error: "invalid_grant" });
    },
  });
  const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.requiresReauth, true);
});

test("a Google outage returns 503 and does not ask the user to sign in", async () => {
  for (const failure of [
    googleFailure(503, { error: "backend_error" }),
    googleFailure(429, { error: "rate_limit_exceeded" }),
    googleFailure(null, null), // never reached Google
  ]) {
    const { deps: d } = deps({
      session: liveSession(),
      google: async () => {
        throw failure;
      },
    });
    const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);
    const body = await res.json();

    assert.equal(res.status, 503, "a transient failure must not be a 401");
    assert.equal(
      body.requiresReauth,
      false,
      "the plugin treats requiresReauth as 'wipe the session' — it must be false here",
    );
    assert.equal(body.retryable, true);
  }
});

test("our own bad client credentials do not sign the user base out", async () => {
  const { deps: d } = deps({
    session: liveSession(),
    google: async () => {
      throw googleFailure(401, { error: "invalid_client" });
    },
  });
  const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);
  const body = await res.json();

  assert.equal(res.status, 503);
  assert.equal(body.requiresReauth, false);
});

test("a successful refresh renews the session deadline", async () => {
  const { deps: d, updates } = deps({ session: liveSession() });
  const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);

  assert.equal(res.status, 200);
  assert.equal(updates.length, 1);
  const renewed = updates[0].expiresAt as Date;
  assert.ok(renewed instanceof Date, "expiresAt must be written on every refresh");
  // Before this existed, expiresAt was set once at sign-in and never renewed,
  // which logged every user out 30 days later regardless of activity.
  assert.ok(renewed.getTime() > Date.now() + SESSION_ABSOLUTE_LIFETIME_MS - 60_000);
});

test("renewal is capped at the session's maximum lifetime", async () => {
  const old = liveSession();
  // Created long ago, so a full idle window would push past the ceiling.
  old.createdAt = new Date(Date.now() - 85 * 24 * 60 * 60 * 1000);
  const { deps: d, updates } = deps({ session: old });
  await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);

  const renewed = updates[0].expiresAt as Date;
  const ceiling = old.createdAt.getTime() + SESSION_MAX_LIFETIME_MS;
  assert.ok(
    renewed.getTime() <= ceiling,
    "renewal must never move past the ceiling, or a stolen token lives forever",
  );
});

test("an unchanged document is not mistaken for a dead session", async () => {
  // Google may hand back the same access token; expiresAt also changes, but the
  // route must key on matchedCount either way. modifiedCount:0 must not 401.
  const { deps: d } = deps({
    session: liveSession(),
    updateResult: { matchedCount: 1, modifiedCount: 0 },
  });
  const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);
  assert.equal(res.status, 200);
});

test("losing a rotation race serves the winner's token, not a logout", async () => {
  const { deps: d } = deps({
    session: liveSession(),
    updateResult: { matchedCount: 0, modifiedCount: 0 },
    afterUpdate: {
      _id: "sess-1",
      sessionId: "s1",
      accessToken: "winner-token",
      accessTokenExpiresAt: Date.now() + 3_600_000,
      createdAt: CREATED_AT,
    },
  });
  const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.accessToken, "winner-token");
});

test("a session that genuinely vanished mid-refresh is retryable, not fatal", async () => {
  const { deps: d } = deps({
    session: liveSession(),
    updateResult: { matchedCount: 0, modifiedCount: 0 },
    afterUpdate: null,
  });
  const res = await handleRefresh(request({ accessToken: ACCESS_TOKEN }), d);
  const body = await res.json();

  assert.equal(res.status, 503);
  assert.equal(body.requiresReauth, false);
});

test("a token matching no session still requires re-auth", async () => {
  const { deps: d } = deps({ session: null });
  const res = await handleRefresh(request({ accessToken: "unknown-token" }), d);
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.requiresReauth, true);
});
