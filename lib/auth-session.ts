import crypto from "node:crypto";

export const SESSION_ABSOLUTE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
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
