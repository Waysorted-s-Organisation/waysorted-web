import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import dbConnect from "@/lib/db";
import Session from "@/models/session";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.OAUTH_REDIRECT_URI;

    if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
    if (!redirectUri) throw new Error("Missing OAUTH_REDIRECT_URI");

    await dbConnect();

    const sessionId = uuid();
    await Session.create({ sessionId, createdAt: new Date() });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: sessionId,
        access_type: "offline",
        prompt: "consent",
      }
    ).toString()}`;

    return NextResponse.json({ sessionId, authUrl });
  } catch (error: unknown) {
    console.error("Error in /api/auth/start:", error);
    return NextResponse.json({ error: (error as Error).message || "start_failed" }, { status: 500 });
  }
}