import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";
import type { IUser } from "@/types/user";
import { clearFigmaCredentials, getFigmaHeaders, REQUIRED_FIGMA_SCOPES } from "@/lib/figma-auth";

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get("fileKey");

  if (!fileKey) {
    return NextResponse.json({ error: "Missing fileKey parameter" }, { status: 400 });
  }

  // Support both cookie-based sessionId and Bearer accessToken for plugin flexibility
  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get("sessionId")?.value;

  let authToken: string | null = null;
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    authToken = authHeader.split(" ")[1];
  }

  if (!cookieSessionId && !authToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Try cookie sessionId first, then Bearer accessToken (matches how /api/user/profile works)
  let session = cookieSessionId
    ? await Session.findOne({ sessionId: cookieSessionId }).populate<{ user: IUser }>("user")
    : null;

  if (!session && authToken) {
    session = await Session.findOne({ accessToken: authToken }).populate<{ user: IUser }>("user");
  }
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const user = session.user;

  // Public OAuth review expects access to happen on behalf of the user who
  // authorized the app. Do not fall back to a shared personal token here.
  let token = user.figmaAccessToken;

  if (!token) {
    return NextResponse.json(
      {
        error: "Figma account not linked",
        notLinked: true,
        requiredScopes: REQUIRED_FIGMA_SCOPES,
      },
      { status: 403 },
    );
  }

  try {
    const figmaHeaders = getFigmaHeaders(token);

    let figmaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
      method: "GET",
      headers: figmaHeaders
    });

    // Auto-refresh logic if the token expired
    if (figmaRes.status === 401 && user.figmaRefreshToken) {
      const clientId = process.env.FIGMA_CLIENT_ID;
      const clientSecret = process.env.FIGMA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
         return NextResponse.json({ error: "Figma OAuth env config missing on server." }, { status: 500 });
      }

      const refreshRes = await fetch("https://api.figma.com/v1/oauth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuthHeader(clientId, clientSecret),
        },
        body: new URLSearchParams({
           refresh_token: user.figmaRefreshToken,
        }).toString()
      });

      const refreshData = await refreshRes.json();
      
      if (refreshRes.ok) {
        const refreshedToken = String(refreshData.access_token || "");
        token = refreshedToken;
        // Update user in DB
        await User.findByIdAndUpdate(user._id, {
          figmaAccessToken: refreshedToken,
          figmaTokenExpiresAt: refreshData.expires_in
            ? new Date(Date.now() + Number(refreshData.expires_in) * 1000)
            : undefined,
        });

        // Retry the api call
        figmaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
          method: "GET",
          headers: getFigmaHeaders(refreshedToken)
        });
      } else {
        return NextResponse.json(
          {
            error: "Could not refresh Figma token. Please re-link Figma account.",
            notLinked: true,
            requiredScopes: REQUIRED_FIGMA_SCOPES,
          },
          { status: 403 },
        );
      }
    }

    if (!figmaRes.ok) {
       const text = await figmaRes.text();
       if (figmaRes.status === 401) {
         await clearFigmaCredentials(user._id);
         return NextResponse.json(
           {
             error: "Invalid or expired Figma token. Please re-link Figma account.",
             details: text,
             notLinked: true,
             reason: "pat_invalid_or_expired",
             requiredScopes: REQUIRED_FIGMA_SCOPES,
           },
           { status: 403 },
         );
       }
       return NextResponse.json({ error: "Figma API error", details: text }, { status: figmaRes.status });
    }

    const data = await figmaRes.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error("Figma Proxy API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
