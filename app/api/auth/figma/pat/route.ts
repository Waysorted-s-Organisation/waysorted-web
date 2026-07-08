import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";
import type { IUser } from "@/types/user";
import { REQUIRED_FIGMA_SCOPES, validateFigmaToken } from "@/lib/figma-auth";

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
    const fileKey = typeof body.fileKey === "string" ? body.fileKey.trim() : null;

    if (!pat || typeof pat !== "string") {
      return NextResponse.json({ error: "Missing or invalid Personal Access Token" }, { status: 400 });
    }

    const trimmedPat = pat.trim();
    const validation = await validateFigmaToken(trimmedPat, fileKey);

    if (!validation.ok) {
      const message =
        validation.reason === "comments_check_failed"
          ? "This PAT could not access comments for the provided Figma file. Check the file URL, permissions, and file_comments scope."
          : validation.status === 401 || validation.status === 403
          ? "Invalid or expired Figma Personal Access Token."
          : "Unable to validate Figma Personal Access Token. Please try again.";

      return NextResponse.json(
        {
          error: message,
          reason: validation.reason === "comments_check_failed"
            ? "file_not_accessible"
            : validation.status === 401 || validation.status === 403
            ? "pat_invalid_or_expired"
            : "figma_unreachable",
        },
        { status: validation.status === 401 || validation.status === 403 ? 400 : 502 },
      );
    }

    // Save PAT on the User profile
    await User.findByIdAndUpdate(session.user._id, {
      figmaAccessToken: trimmedPat,
      figmaUserId: validation.figmaUserId || undefined,
      // We explicitly unset refresh tokens since PATs don't use them
      $unset: {
        figmaRefreshToken: 1,
        figmaTokenExpiresAt: 1
      },
      figmaScopes: REQUIRED_FIGMA_SCOPES,
      figmaConnectedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Figma PAT API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
