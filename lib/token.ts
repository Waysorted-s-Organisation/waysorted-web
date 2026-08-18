import axios from "axios";

interface RefreshedTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

/**
 * Why a refresh did not succeed.
 *
 * "revoked" is the only outcome that means the user must sign in again: Google
 * has told us the grant is gone. Everything else — a network failure, a Google
 * outage, rate limiting, or our own client credentials being misconfigured —
 * says nothing about the user's session and will very likely succeed on the
 * next attempt.
 */
export type TokenRefreshFailureKind = "revoked" | "transient" | "misconfigured";

export class TokenRefreshError extends Error {
  readonly kind: TokenRefreshFailureKind;
  readonly googleError: string | null;
  readonly upstreamStatus: number | null;

  constructor(
    kind: TokenRefreshFailureKind,
    message: string,
    googleError: string | null,
    upstreamStatus: number | null
  ) {
    super(message);
    this.name = "TokenRefreshError";
    this.kind = kind;
    this.googleError = googleError;
    this.upstreamStatus = upstreamStatus;
  }
}

/**
 * Decides whether a failed refresh means the user is signed out.
 *
 * Google returns `invalid_grant` when a refresh token has been revoked, has
 * expired, or was superseded — that is the one case where the session is
 * genuinely dead. `invalid_client` and `unauthorized_client` mean OUR
 * credentials are wrong, and forcing every user to re-authenticate would not
 * fix that and would log out the entire user base during a misconfiguration.
 * A 429 or a 5xx is Google having a bad minute. An error with no response at
 * all never reached Google: DNS failure, connect timeout, socket hangup.
 */
export function classifyRefreshFailure(error: unknown): TokenRefreshError {
  if (error instanceof TokenRefreshError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const data = error.response?.data as { error?: string; error_description?: string } | undefined;
    const googleError = typeof data?.error === "string" ? data.error : null;
    const detail = data?.error_description || error.message;

    if (!error.response) {
      return new TokenRefreshError(
        "transient",
        `Could not reach the token endpoint: ${detail}`,
        null,
        null
      );
    }

    if (googleError === "invalid_grant") {
      return new TokenRefreshError("revoked", `Refresh token rejected: ${detail}`, googleError, status);
    }

    if (googleError === "invalid_client" || googleError === "unauthorized_client") {
      return new TokenRefreshError("misconfigured", `OAuth client rejected: ${detail}`, googleError, status);
    }

    if (status === 429 || (status !== null && status >= 500)) {
      return new TokenRefreshError("transient", `Token endpoint returned ${status}: ${detail}`, googleError, status);
    }

    // An unrecognised 4xx. Treated as transient on purpose: a wrong guess here
    // signs a real user out permanently, while the opposite wrong guess only
    // costs one more retry.
    return new TokenRefreshError("transient", `Unexpected token endpoint response ${status}: ${detail}`, googleError, status);
  }

  const message = error instanceof Error ? error.message : String(error);
  return new TokenRefreshError("transient", `Token refresh failed: ${message}`, null, null);
}

/**
 * Refresh a Google OAuth access token using a refresh token
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<RefreshedTokens> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await axios.post<RefreshedTokens>(
    "https://oauth2.googleapis.com/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return response.data;
}
