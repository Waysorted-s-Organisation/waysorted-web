import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import Session from "@/models/session";

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get("code");
  const state = urlObj.searchParams.get("state");
  const nextParam = urlObj.searchParams.get("next");
  const redirectPath = nextParam && nextParam.startsWith("/") ? nextParam : "/";

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

    const {
      access_token,
      refresh_token,
      expires_in,
      id_token,
    } = tokenRes.data;

    const accessTokenExpiresAt = Date.now() + expires_in * 1000;

    const { data: googleUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const user = await User.findOneAndUpdate(
      { email: googleUser.email },
      {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Session.updateOne(
      { sessionId: state },
      {
        $set: {
          accessToken: access_token,
            // refresh_token may be missing on subsequent consents; only store if provided
          refreshToken: refresh_token || existingSession.refreshToken,
          accessTokenExpiresAt,
          idToken: id_token,
          user: user._id,
          completed: true,
          completedAt: new Date(),
        },
      }
    );

    const finalUrl = new URL(redirectPath, urlObj.origin);
    const response = NextResponse.redirect(finalUrl);

    response.cookies.set("sessionId", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
    } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      console.error("OAuth callback error:", err.response.data);
    } else {
      console.error("OAuth callback error:", err);
    }
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent("oauth_failed")}`, request.url)
    );
  }
}