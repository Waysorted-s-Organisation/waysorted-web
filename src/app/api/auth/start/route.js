import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "../../../../lib/db";
import Session from "../../../../models/session";

export async function GET(request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.OAUTH_REDIRECT_URI;

    if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
    if (!redirectUri) throw new Error("Missing OAUTH_REDIRECT_URI");

    await dbConnect();

    const sessionId = uuidv4();
    await Session.create({ sessionId, createdAt: new Date() });

    // Build URL with proper encoding
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: sessionId,
        prompt: "consent",
      }
    ).toString()}`;

    console.log("Generated auth URL:", authUrl); // Debug log

    return NextResponse.json(
      { sessionId, authUrl },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/auth/start:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
