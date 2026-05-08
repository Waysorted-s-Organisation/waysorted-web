import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";
import type { IUser } from "@/types/user";

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

  if (!user.figmaAccessToken) {
    return NextResponse.json({ error: "Figma account not linked", notLinked: true }, { status: 403 });
  }

  let token = user.figmaAccessToken;

  try {
    let figmaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
           client_id: clientId,
           client_secret: clientSecret,
           refresh_token: user.figmaRefreshToken,
        }).toString()
      });

      const refreshData = await refreshRes.json();
      
      if (refreshRes.ok) {
        token = refreshData.access_token;
        // Update user in DB
        await User.findByIdAndUpdate(user._id, {
          figmaAccessToken: refreshData.access_token,
        });

        // Retry the api call
        figmaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } else {
        return NextResponse.json({ error: "Could not refresh Figma token. Please re-link Figma account." }, { status: 403 });
      }
    }

    if (!figmaRes.ok) {
       const text = await figmaRes.text();
       return NextResponse.json({ error: "Figma API error", details: text }, { status: figmaRes.status });
    }

    const data = await figmaRes.json();

    // Map through the comments. From Figma API, comments have an array structure representing threads.
    return NextResponse.json(data);

  } catch (error) {
    console.error("Figma Proxy API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
