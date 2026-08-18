import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { extractRequestSignals } from "@/lib/billing/request-signals";
import { getCountryFromRequest, getCountryTier, normalizeCountry } from "@/lib/billing/regional-pricing";
import { OPTIONS, withCors } from "@/lib/cors";
import {
  AUTH_POLL_LIFETIME_MS,
  SESSION_ABSOLUTE_LIFETIME_MS,
  createOpaqueSecret,
  hashOpaqueSecret,
} from "@/lib/auth-session";
export { OPTIONS };

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.OAUTH_REDIRECT_URI;

    if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
    if (!redirectUri) throw new Error("Missing OAUTH_REDIRECT_URI");

    const url = new URL(request.url);
    const source = url.searchParams.get("source") || "web";

    await dbConnect();

    const now = new Date();
    const sessionId = crypto.randomUUID();
    const oauthState = createOpaqueSecret();
    const pollId = crypto.randomUUID();
    const pollSecret = createOpaqueSecret();
    const signals = extractRequestSignals(request);
    const detectedCountry = getCountryFromRequest(request);
    const countryCode = detectedCountry ? normalizeCountry(detectedCountry) : null;
    await Session.create({
      sessionId,
      oauthState,
      pollId,
      pollSecretHash: hashOpaqueSecret(pollSecret),
      pollExpiresAt: new Date(now.getTime() + AUTH_POLL_LIFETIME_MS),
      expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_LIFETIME_MS),
      createdAt: now,
      source,
      ipAddress: signals.ipAddress,
      ipPrefix: signals.ipPrefix,
      userAgent: signals.userAgent,
      deviceId: signals.deviceId,
      countryCode,
      pricingTierAtAuth: countryCode ? getCountryTier(countryCode) : null,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: oauthState,
      access_type: "offline",
      prompt: "consent",
    }).toString()}`;

    return withCors(
      request,
      NextResponse.json({ sessionId: pollId, pollSecret, authUrl }),
    );
  } catch (error: unknown) {
    console.error("Error in /api/auth/start:", error);
    return withCors(
      request,
      NextResponse.json({ error: (error as Error).message || "start_failed" }, { status: 500 }),
    );
  }
}
