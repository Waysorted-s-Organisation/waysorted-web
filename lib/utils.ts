import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * Generate a unique state string for OAuth
 */
export function generateState(): string {
  return uuidv4();
}

/**
 * Verify the code challenge with the code verifier (PKCE)
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  const hash = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return hash === codeChallenge;
}

/**
 * Create a JSON response with appropriate status
 */
export function createResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Helper for error responses
 */
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Parse cookies from request headers
 */
export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, value] = cookie.trim().split("=");
      return [key, decodeURIComponent(value || "")];
    })
  );
}

interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
}

/**
 * Set a cookie on the response
 */
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): NextResponse {
  const cookieOptions: CookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    ...options,
  };

  const cookieString = `${name}=${encodeURIComponent(value)}; ${Object.entries(
    cookieOptions
  )
    .map(([key, val]) => {
      if (val === true) return key;
      if (val === false) return "";
      return `${key}=${val}`;
    })
    .filter(Boolean)
    .join("; ")}`;

  response.headers.set("Set-Cookie", cookieString);
  return response;
}

/**
 * Clear a cookie on the response
 */
export function clearCookie(
  response: NextResponse,
  name: string
): NextResponse {
  response.headers.set(
    "Set-Cookie",
    `${name}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  );
  return response;
}
