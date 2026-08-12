import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { refreshGoogleToken } from "@/lib/token";
import { sessionExpiryFilter } from "@/lib/auth-session";

export { OPTIONS } from "@/lib/cors";

interface SessionDoc {
  _id: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
}

function requiresReauth(message: string) {
  return NextResponse.json(
    { error: message, requiresReauth: true },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";

    if (!accessToken) {
      return requiresReauth("Missing access token.");
    }

    await dbConnect();
    const now = new Date();
    const session = (await Session.findOne({
      accessToken,
      completed: true,
      user: { $exists: true, $ne: null },
      ...sessionExpiryFilter(now),
    }).lean()) as SessionDoc | null;

    if (!session?.accessToken) {
      return requiresReauth("Session not found or expired.");
    }

    const refreshBufferMs = 5 * 60 * 1000;
    const expiresAt = session.accessTokenExpiresAt;
    if (!expiresAt) {
      return requiresReauth("Token expiry is unavailable.");
    }

    if (Date.now() <= expiresAt - refreshBufferMs) {
      return NextResponse.json({
        accessToken: session.accessToken,
        refreshed: false,
        expiresAt,
      });
    }

    if (!session.refreshToken) {
      return requiresReauth("Token refresh is unavailable.");
    }

    try {
      const refreshedTokens = await refreshGoogleToken(session.refreshToken);
      const newAccessToken = refreshedTokens.access_token;
      const newExpiresAt = Date.now() + refreshedTokens.expires_in * 1000;
      const updateFields: Record<string, unknown> = {
        accessToken: newAccessToken,
        accessTokenExpiresAt: newExpiresAt,
      };

      if (refreshedTokens.refresh_token) {
        updateFields.refreshToken = refreshedTokens.refresh_token;
      }

      const updated = await Session.updateOne(
        {
          _id: session._id,
          accessToken,
          completed: true,
          ...sessionExpiryFilter(new Date()),
        },
        { $set: updateFields },
      );

      if (updated.modifiedCount !== 1) {
        return requiresReauth("Session changed or expired during refresh.");
      }

      return NextResponse.json({
        accessToken: newAccessToken,
        refreshed: true,
        expiresAt: newExpiresAt,
      });
    } catch (refreshError) {
      console.error("Google token refresh failed:", refreshError);
      return requiresReauth("Token refresh failed. Please sign in again.");
    }
  } catch (error) {
    console.error("Error in /api/auth/refresh:", error);
    return NextResponse.json({ error: "Unable to refresh authentication." }, { status: 500 });
  }
}
