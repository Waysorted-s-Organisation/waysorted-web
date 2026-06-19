import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state parameter" }, { status: 400 });
  }

  await dbConnect();

  // Validate the state matches an active session
  const session = await Session.findOne({ sessionId: state });
  if (!session) {
    return NextResponse.json({ error: "Invalid state/session" }, { status: 401 });
  }

  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  const redirectUri = process.env.FIGMA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Figma OAuth env vars not set" }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch("https://api.figma.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(clientId, clientSecret),
      },
      body: new URLSearchParams({
        redirect_uri: redirectUri,
        code: code,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        console.error("Figma token error:", tokenData);
        return NextResponse.json({ error: "Failed to exchange token", details: tokenData }, { status: 400 });
    }

    const { access_token, refresh_token, user_id, user_id_string, expires_in } = tokenData;

    // Save tokens on the User profile
    await User.findByIdAndUpdate(session.user, {
      figmaUserId: user_id_string || user_id,
      figmaAccessToken: access_token,
      figmaRefreshToken: refresh_token,
      figmaTokenExpiresAt: expires_in
        ? new Date(Date.now() + Number(expires_in) * 1000)
        : undefined,
      figmaScopes: ["current_user:read", "file_comments:read"],
      figmaConnectedAt: new Date(),
    });

    return NextResponse.redirect(new URL("/connected", request.url));

  } catch (error) {
    console.error("Figma OAuth Callback Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
