import User from "../../../../models/user";
import Session from "../../../../models/session";
import dbConnect from "../../../../lib/db";
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const sessionId = searchParams.get("state");

    if (!code || !sessionId) {
      return new NextResponse("Missing code or sessionId", { status: 400 });
    }

    /* ─── 1 ▸ Exchange the code for tokens ─── */
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

    // Calculate expiry timestamp (milliseconds)
    const accessTokenExpiresAt = Date.now() + expires_in * 1000;

    /* ─── 2 ▸ Fetch user's Google profile ─── */
    const { data: googleUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    await dbConnect();

    /* ─── 3 ▸ Find or create user ─── */
    const user = await User.findOneAndUpdate(
      { email: googleUser.email },
      {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    /* ─── 4 ▸ Update session with tokens and user ref ─── */
    await Session.updateOne(
      { sessionId },
      {
        $set: {
          accessToken: access_token,
          refreshToken: refresh_token, // NEW
          accessTokenExpiresAt, // NEW
          idToken: id_token,
          user: user._id,
          completed: true,
          completedAt: new Date(),
        },
      }
    );

    const successUrl = new URL("/success", request.url);
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("OAuth callback error", err);
    return NextResponse.json(
      { error: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
