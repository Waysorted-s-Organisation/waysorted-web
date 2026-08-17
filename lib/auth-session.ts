import crypto from "node:crypto";

/**
 * How long a session may go unused before it dies.
 *
 * Renewed on every successful token refresh (app/api/auth/refresh/route.ts),
 * so this is an IDLE window for an active user and an issuance window at
 * sign-in (app/api/auth/start/route.ts). Before renewal existed it was
 * effectively absolute, which signed every user out exactly 30 days after
 * signing in no matter how much they used the product.
 */
export const SESSION_ABSOLUTE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The hard ceiling renewal may never move past, measured from creation.
 *
 * A purely sliding window has no upper bound, and this session's access token
 * doubles as its refresh credential: /api/auth/refresh authenticates on
 * possession of Session.accessToken alone. So without a ceiling, anyone
 * holding a stolen token keeps it alive indefinitely simply by polling — and
 * there is currently no revocation path to compensate (no rate limit, no TTL
 * index, no revoke-all, and the plugin's sign-out never reaches the server).
 * Ninety days bounds that exposure while still being far longer than the
 * thirty-day wall real users were hitting.
 */
export const SESSION_MAX_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;
export const AUTH_POLL_LIFETIME_MS = 10 * 60 * 1000;

export function createOpaqueSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashOpaqueSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function opaqueSecretMatches(value: string, expectedHash: string) {
  const actual = Buffer.from(hashOpaqueSecret(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function sessionExpiryFilter(now = new Date()) {
  return {
    $or: [
      { expiresAt: { $gt: now } },
      {
        expiresAt: { $exists: false },
        createdAt: { $gt: new Date(now.getTime() - SESSION_ABSOLUTE_LIFETIME_MS) },
      },
    ],
  };
}
