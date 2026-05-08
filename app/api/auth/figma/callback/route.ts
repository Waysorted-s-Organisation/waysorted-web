import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";

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
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
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

    const { access_token, refresh_token, user_id } = tokenData;

    // Save tokens on the User profile
    await User.findByIdAndUpdate(session.user, {
      figmaUserId: user_id,
      figmaAccessToken: access_token,
      figmaRefreshToken: refresh_token,
    });

    // Provide a simple UI to close the popup window for the plugin user
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Figma Linked</title>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fafafa; }
              .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
              h2 { margin-top: 0; color: #333; }
              p { color: #555; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Figma Account Linked Successfully!</h2>
              <p>You can close this window and return to the plugin to use the Comment Summarizer.</p>
          </div>
          <script>
            // Tell the Figma plugin window to close this if it opened it, or close anyway.
            setTimeout(() => {
                window.close();
            }, 3000);
          </script>
      </body>
      </html>
    `;

    return new NextResponse(htmlResponse, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error("Figma OAuth Callback Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
