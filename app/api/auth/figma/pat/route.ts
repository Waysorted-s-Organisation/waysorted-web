import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";
import type { IUser } from "@/types/user";

export async function POST(request: Request) {
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

  // Try cookie sessionId first, then Bearer accessToken
  let session = cookieSessionId
    ? await Session.findOne({ sessionId: cookieSessionId }).populate<{ user: IUser }>("user")
    : null;

  if (!session && authToken) {
    session = await Session.findOne({ accessToken: authToken }).populate<{ user: IUser }>("user");
  }
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const pat = body.pat;

    if (!pat || typeof pat !== "string") {
      return NextResponse.json({ error: "Missing or invalid Personal Access Token" }, { status: 400 });
    }

    // Save PAT on the User profile
    await User.findByIdAndUpdate(session.user._id, {
      figmaAccessToken: pat.trim(),
      // We explicitly unset refresh tokens since PATs don't use them
      $unset: {
        figmaRefreshToken: 1,
        figmaTokenExpiresAt: 1
      },
      figmaScopes: ["current_user:read", "file_comments:read"],
      figmaConnectedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Figma PAT API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
