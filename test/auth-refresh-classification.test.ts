/**
 * The refresh endpoint used to answer every failure with `401 requiresReauth`.
 *
 * Clients — the Figma plugin in particular — treat that as "the session is
 * dead, wipe the stored credentials". So a DNS blip, a Google 5xx, rate
 * limiting, or our own OAuth client being misconfigured all signed users out
 * permanently and identically to a genuinely revoked grant. In production,
 * `session-recovery-failed` (the plugin's transient branch) has zero lifetime
 * occurrences while `refresh-failed` has eight, all `{status:401}` — the
 * transient path existed on both sides and was unreachable.
 *
 * These tests pin the decision table: exactly one condition signs a user out.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, AxiosHeaders } from "axios";
import {
  classifyRefreshFailure,
  TokenRefreshError,
} from "@/lib/token";
import {
  SESSION_ABSOLUTE_LIFETIME_MS,
  SESSION_MAX_LIFETIME_MS,
} from "@/lib/auth-session";

function googleError(status: number, body: unknown): AxiosError {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    statusText: "",
    data: body,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

function networkError(message: string): AxiosError {
  const error = new AxiosError(message);
  error.code = "ECONNRESET";
  return error;
}

test("a revoked grant is the only failure that signs the user out", () => {
  const result = classifyRefreshFailure(
    googleError(400, { error: "invalid_grant", error_description: "Token has been expired or revoked." }),
  );
  assert.equal(result.kind, "revoked");
  assert.equal(result.googleError, "invalid_grant");
  assert.equal(result.upstreamStatus, 400);
});

test("a Google outage is transient, not a dead session", () => {
  for (const status of [500, 502, 503, 504]) {
    const result = classifyRefreshFailure(googleError(status, { error: "backend_error" }));
    assert.equal(result.kind, "transient", `HTTP ${status} must not sign anyone out`);
  }
});

test("rate limiting is transient", () => {
  assert.equal(classifyRefreshFailure(googleError(429, { error: "rate_limit_exceeded" })).kind, "transient");
});

test("a request that never reached Google is transient", () => {
  const result = classifyRefreshFailure(networkError("socket hang up"));
  assert.equal(result.kind, "transient");
  assert.equal(result.upstreamStatus, null);
  assert.match(result.message, /Could not reach the token endpoint/);
});

test("our own bad client credentials must not log out the user base", () => {
  // invalid_client means OUR configuration is wrong. Forcing every user to
  // re-authenticate cannot fix it, and would be irreversible.
  for (const code of ["invalid_client", "unauthorized_client"]) {
    const result = classifyRefreshFailure(googleError(401, { error: code }));
    assert.equal(result.kind, "misconfigured", `${code} must not be treated as a revoked grant`);
    assert.notEqual(result.kind, "revoked");
  }
});

test("an unrecognised 4xx errs toward keeping the session", () => {
  // Guessing "revoked" wrongly is permanent; guessing "transient" wrongly
  // costs one retry.
  const result = classifyRefreshFailure(googleError(418, { error: "something_new" }));
  assert.equal(result.kind, "transient");
});

test("a non-axios throw is transient", () => {
  assert.equal(classifyRefreshFailure(new Error("boom")).kind, "transient");
  assert.equal(classifyRefreshFailure("boom").kind, "transient");
});

test("an already-classified error passes through unchanged", () => {
  const original = new TokenRefreshError("revoked", "already known", "invalid_grant", 400);
  assert.equal(classifyRefreshFailure(original), original);
});

test("the renewal is capped so a session cannot be extended forever", () => {
  // Renewal without a ceiling means a stolen token stays valid indefinitely,
  // because polling the refresh endpoint is itself what extends it.
  const createdAt = new Date("2026-01-01T00:00:00Z").getTime();
  const renewAt = (now: number) =>
    Math.min(now + SESSION_ABSOLUTE_LIFETIME_MS, createdAt + SESSION_MAX_LIFETIME_MS);

  // Early in the session's life, renewal gives a full idle window.
  const early = createdAt + 5 * 24 * 60 * 60 * 1000;
  assert.equal(renewAt(early), early + SESSION_ABSOLUTE_LIFETIME_MS);

  // Near the ceiling, renewal is clamped.
  const late = createdAt + 85 * 24 * 60 * 60 * 1000;
  assert.equal(renewAt(late), createdAt + SESSION_MAX_LIFETIME_MS);

  // And it can never move past it, however often the endpoint is polled.
  const past = createdAt + 200 * 24 * 60 * 60 * 1000;
  assert.ok(renewAt(past) <= createdAt + SESSION_MAX_LIFETIME_MS);
  assert.ok(SESSION_MAX_LIFETIME_MS > SESSION_ABSOLUTE_LIFETIME_MS);
});
