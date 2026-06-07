import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { OPTIONS, withCors } from "@/lib/cors";
import { refreshGoogleToken } from "@/lib/token";
export { OPTIONS };

async function getOrRefreshAccessToken(session: any): Promise<string> {
  if (!session.accessToken) return "";

  const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
  const isExpiredOrExpiringSoon =
    session.accessTokenExpiresAt &&
    Date.now() > session.accessTokenExpiresAt - REFRESH_BUFFER_MS;

  if (isExpiredOrExpiringSoon) {
    let refreshToken = session.refreshToken;
    if (!refreshToken && session.user) {
      const prevSession = await Session.findOne({
        user: session.user,
        refreshToken: { $exists: true, $ne: null }
      }).sort({ completedAt: -1 }).lean() as any;
      if (prevSession?.refreshToken) {
        refreshToken = prevSession.refreshToken;
        await Session.updateOne({ _id: session._id }, { $set: { refreshToken } });
        console.log("Recovered fallback refreshToken from previous session during poll.");
      }
    }

    if (refreshToken) {
      try {
        console.log("Proactively refreshing expired/expiring token during poll for session:", session.sessionId);
        const refreshedTokens = await refreshGoogleToken(refreshToken);
        const newAccessToken = refreshedTokens.access_token;
        const newExpiresAt = Date.now() + refreshedTokens.expires_in * 1000;

        const updateFields: Record<string, unknown> = {
          accessToken: newAccessToken,
          accessTokenExpiresAt: newExpiresAt,
        };
        if (refreshedTokens.refresh_token) {
          updateFields.refreshToken = refreshedTokens.refresh_token;
        }

        await Session.updateOne({ _id: session._id }, { $set: updateFields });
        console.log("Token refreshed successfully during poll for session:", session.sessionId);
        return newAccessToken;
      } catch (err) {
        console.error("Failed to proactively refresh token during poll:", err);
      }
    }
  }

  return session.accessToken;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return withCors(request, NextResponse.json({ error: "Missing sessionId" }, { status: 400 }));
    }

    await dbConnect();
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return withCors(request, NextResponse.json({ error: "Invalid session" }, { status: 404 }));
    }

    if (session.accessToken && session.completed) {
      const token = await getOrRefreshAccessToken(session);
      return withCors(request, NextResponse.json({ accessToken: token }));
    }

    // Still waiting for user to complete OAuth flow
    return withCors(request, NextResponse.json({ pending: true }));
  } catch (error) {
    console.error("Error in /api/auth/poll:", error);
    return withCors(
      request,
      NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }),
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let sessionId: string | null = null;
    try {
      const body = await request.json();
      sessionId = body.sessionId || null;
    } catch {
      const { searchParams } = new URL(request.url);
      sessionId = searchParams.get("sessionId");
    }

    if (!sessionId) {
      return withCors(request, NextResponse.json({ error: "Missing sessionId" }, { status: 400 }));
    }

    await dbConnect();
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return withCors(request, NextResponse.json({ error: "Invalid session" }, { status: 404 }));
    }

    if (session.accessToken && session.completed) {
      const token = await getOrRefreshAccessToken(session);
      return withCors(request, NextResponse.json({ accessToken: token }));
    }

    return withCors(request, NextResponse.json({ pending: true }));
  } catch (error) {
    console.error("Error in /api/auth/poll POST:", error);
    return withCors(
      request,
      NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }),
    );
  }
}
