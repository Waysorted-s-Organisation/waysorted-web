import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { refreshGoogleToken } from "@/lib/token";
import type { IUser } from "@/models/user";

interface SessionWithUser {
  _id: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  user?: IUser;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    await dbConnect();

    // Find session by accessToken
    let session = (await Session.findOne({ accessToken: token })
      .populate<{ user: IUser }>("user", "name email picture favorites")
      .lean()) as SessionWithUser | null;

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if token expired with 1 minute buffer
    if (
      session.accessTokenExpiresAt &&
      Date.now() > session.accessTokenExpiresAt - 60000
    ) {
      if (!session.refreshToken) {
        return NextResponse.json(
          { error: "Token expired and no refresh token available" },
          { status: 401 }
        );
      }

      try {
        // Refresh access token
        const refreshedTokens = await refreshGoogleToken(session.refreshToken);

        const newAccessToken = refreshedTokens.access_token;
        const expiresIn = refreshedTokens.expires_in;
        const newAccessTokenExpiresAt = Date.now() + expiresIn * 1000;

        // Optionally update refreshToken if returned
        const updateFields: Record<string, unknown> = {
          accessToken: newAccessToken,
          accessTokenExpiresAt: newAccessTokenExpiresAt,
        };
        if (refreshedTokens.refresh_token) {
          updateFields.refreshToken = refreshedTokens.refresh_token;
        }

        await Session.updateOne({ _id: session._id }, { $set: updateFields });

        // Reload session with new token
        session = (await Session.findOne({ _id: session._id })
          .populate<{ user: IUser }>("user", "name email picture favorites")
          .lean()) as SessionWithUser | null;
      } catch (refreshError) {
        console.error("Failed to refresh Google token:", refreshError);
        return NextResponse.json(
          { error: "Failed to refresh token" },
          { status: 401 }
        );
      }
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json(session.user);
  } catch (error) {
    console.error("Error in /api/user/profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
