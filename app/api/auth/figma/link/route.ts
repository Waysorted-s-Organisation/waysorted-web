import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!sessionId) {
    return NextResponse.redirect(new URL("/login?next=/api/auth/figma/link", appUrl));
  }

  await dbConnect();
  const session = await Session.findOne({ sessionId });
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/api/auth/figma/link", appUrl));
  }

  const clientId = process.env.FIGMA_CLIENT_ID;
  const redirectUri = process.env.FIGMA_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Figma OAuth env vars not set (FIGMA_CLIENT_ID, FIGMA_REDIRECT_URI)" }, { status: 500 });
  }

  // Use the session ID as state to track they initiated the request
  const state = sessionId; 

  const figmaAuthUrl = new URL("https://www.figma.com/oauth");
  figmaAuthUrl.searchParams.set("client_id", clientId);
  figmaAuthUrl.searchParams.set("redirect_uri", redirectUri);
  figmaAuthUrl.searchParams.set("scope", "file_comments:read");
  figmaAuthUrl.searchParams.set("state", state);
  figmaAuthUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(figmaAuthUrl.toString());
}
