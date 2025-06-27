// /api/auth/callback/route.ts
import User from "../../../../models/user"; // ① NEW
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

    /* ─── 1 ▸ exchange the code for Google tokens ────────────────────── */
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

    const { access_token, id_token } = tokenRes.data;

    /* ─── 2 ▸ pull the Google profile ────────────────────────────────── */
    const { data: googleUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    await dbConnect();

    /* ─── 3 ▸ find-or-create our own user document ───────────────────── */
    // inside /api/auth/callback
    const user = await User.findOneAndUpdate(
      { email: googleUser.email }, // lookup
      {
        email: googleUser.email, // keep for first insert
        name: googleUser.name, // update every login
        picture: googleUser.picture,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    /* ─── 4 ▸ record / update the session row ────────────────────────── */
    await Session.updateOne(
      { sessionId }, // session row created earlier by “/init”
      {
        $set: {
          accessToken: access_token,
          idToken: id_token,
          user: user._id, // store a reference, not the whole object
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
