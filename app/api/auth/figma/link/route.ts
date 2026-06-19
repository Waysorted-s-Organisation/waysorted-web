import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";

const FIGMA_OAUTH_SCOPES = ["current_user:read", "file_comments:read"];
const SESSION_COOKIE_NAME = "sessionId";

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const querySessionId = url.searchParams.get("sessionId");
  const sessionId = cookieSessionId || querySessionId;

  const appUrl = getAppUrl(request);

  if (!sessionId) {
    return NextResponse.redirect(new URL("/login?next=/api/auth/figma/link", appUrl));
  }

  await dbConnect();
  const session = await Session.findOne({ sessionId, user: { $exists: true, $ne: null } });
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/api/auth/figma/link", appUrl));
  }

  const clientId = process.env.FIGMA_CLIENT_ID;
  const redirectUri = process.env.FIGMA_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Figma OAuth env vars not set (FIGMA_CLIENT_ID, FIGMA_REDIRECT_URI)" }, { status: 500 });
  }

  // Figma requires callers to validate that callback state matches the value
  // originally sent. This keeps the plugin flow simple while still tying the
  // callback to an authenticated Waysorted session.
  const state = sessionId;

  const figmaAuthUrl = new URL("https://www.figma.com/oauth");
  figmaAuthUrl.searchParams.set("client_id", clientId);
  figmaAuthUrl.searchParams.set("redirect_uri", redirectUri);
  figmaAuthUrl.searchParams.set("scope", FIGMA_OAUTH_SCOPES.join(","));
  figmaAuthUrl.searchParams.set("state", state);
  figmaAuthUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(figmaAuthUrl.toString());
}
