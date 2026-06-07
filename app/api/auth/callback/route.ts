import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import Session from "@/models/session";
import Subscriber from "@/models/subscriber";
import { ensureStarterGrant } from "@/lib/billing/db";
import { extractRequestSignals } from "@/lib/billing/request-signals";
import { getCountryFromRequest, getCountryTier, normalizeCountry } from "@/lib/billing/regional-pricing";
import { withCors } from "@/lib/cors";

export async function GET(request: NextRequest) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get("code");
  const state = urlObj.searchParams.get("state");
  const nextParam = urlObj.searchParams.get("next");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent("missing_code_or_state")}`, request.url)
    );
  }

  try {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Missing GOOGLE_CLIENT_ID");
    if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Missing GOOGLE_CLIENT_SECRET");
    if (!process.env.OAUTH_REDIRECT_URI) throw new Error("Missing OAUTH_REDIRECT_URI");

    await dbConnect();

    const existingSession = await Session.findOne({ sessionId: state });
    if (!existingSession) {
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent("invalid_state")}`, request.url)
      );
    }

    // Determine redirect path based on session source
    let redirectPath = "/";
    const sessionSource = existingSession.source;
    if (sessionSource === "figma" || sessionSource === "plugin") {
      redirectPath = "/connected";
    } else if (nextParam && nextParam.startsWith("/")) {
      redirectPath = nextParam;
    }

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.OAUTH_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in, id_token } = tokenRes.data;
    const accessTokenExpiresAt = Date.now() + expires_in * 1000;

    const { data: googleUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const callbackSignals = extractRequestSignals(request);
    const callbackCountry = normalizeCountry(getCountryFromRequest(request) || existingSession.countryCode);

    const existingUser = await User.findOne({ email: googleUser.email });
    const user =
      existingUser ||
      new User({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });

    user.name = googleUser.name;
    user.picture = googleUser.picture;
    await user.save();

    // Auto-subscribe to newsletter
    try {
      await Subscriber.findOneAndUpdate(
        { email: googleUser.email },
        {
          email: googleUser.email,
          name: googleUser.name,
          status: "active",
          source: "google-oauth",
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      console.error("Auto-subscription failed:", error);
    }

    // Find a previous session with a refresh token for this user as fallback
    let fallbackRefreshToken = null;
    if (!refresh_token) {
      const prevSession = await Session.findOne({
        user: user._id,
        refreshToken: { $exists: true, $ne: null }
      }).sort({ completedAt: -1 }).lean() as any;
      if (prevSession) {
        fallbackRefreshToken = prevSession.refreshToken;
        console.log("Found fallback refresh token from a previous session for user:", user.email);
      }
    }

    await Session.updateOne(
      { sessionId: state },
      {
        $set: {
          accessToken: access_token,
          refreshToken: refresh_token || fallbackRefreshToken || existingSession.refreshToken,
          accessTokenExpiresAt,
          idToken: id_token,
          user: user._id,
          completed: true,
          completedAt: new Date(),
          ipAddress: callbackSignals.ipAddress || existingSession.ipAddress || null,
          ipPrefix: callbackSignals.ipPrefix || existingSession.ipPrefix || null,
          userAgent: callbackSignals.userAgent || existingSession.userAgent || null,
          deviceId: existingSession.deviceId || callbackSignals.deviceId || null,
          countryCode: callbackCountry,
          pricingTierAtAuth: getCountryTier(callbackCountry),
        },
      }
    );

    await ensureStarterGrant({
      user,
      source: existingSession.source || "web",
      googleSub: typeof googleUser.sub === "string" ? googleUser.sub : null,
      ipPrefix: callbackSignals.ipPrefix || existingSession.ipPrefix || null,
      userAgent: callbackSignals.userAgent || existingSession.userAgent || null,
      deviceId: existingSession.deviceId || callbackSignals.deviceId || null,
    });

    const finalUrl = new URL(redirectPath, urlObj.origin);
    const response = NextResponse.redirect(finalUrl);

    // Add CORS headers to redirect response (needed if Figma follows the redirect)
    withCors(request, response);

    response.cookies.set("sessionId", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    let errorDetails = "";
    if (axios.isAxiosError(err) && err.response) {
      console.error("OAuth callback error:", err.response.data);
      errorDetails = typeof err.response.data === "object" ? JSON.stringify(err.response.data) : String(err.response.data);
    } else {
      console.error("OAuth callback error:", err);
      errorDetails = err instanceof Error ? err.message : String(err);
    }
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent("oauth_failed")}&details=${encodeURIComponent(errorDetails)}`, request.url)
    );
  }
}
