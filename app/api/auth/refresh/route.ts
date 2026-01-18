import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { refreshGoogleToken } from "@/lib/token";
export { OPTIONS } from "@/lib/cors";

interface SessionDoc {
    _id: string;
    sessionId: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
}

/**
 * POST /api/auth/refresh
 * 
 * Proactively refreshes an access token if expired.
 * Returns the (potentially new) access token to the plugin for storage update.
 * 
 * Request body:
 * - accessToken: Current access token stored in plugin
 * - sessionId: (optional) Session ID for fallback lookup
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessToken, sessionId } = body;

        if (!accessToken && !sessionId) {
            return NextResponse.json(
                { error: "Missing accessToken or sessionId" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find session by accessToken first, fallback to sessionId
        let session: SessionDoc | null = null;

        if (accessToken) {
            session = await Session.findOne({ accessToken }).lean() as SessionDoc | null;
        }

        if (!session && sessionId) {
            session = await Session.findOne({ sessionId }).lean() as SessionDoc | null;
        }

        if (!session) {
            return NextResponse.json(
                { error: "Session not found", requiresReauth: true },
                { status: 401 }
            );
        }

        // Check if we have a valid access token
        if (!session.accessToken) {
            return NextResponse.json(
                { error: "No access token in session", requiresReauth: true },
                { status: 401 }
            );
        }

        // Check if token is expired or will expire soon (5 minute buffer for proactive refresh)
        const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
        const isExpiredOrExpiringSoon =
            session.accessTokenExpiresAt &&
            Date.now() > session.accessTokenExpiresAt - REFRESH_BUFFER_MS;

        if (isExpiredOrExpiringSoon) {
            // Token is expired or expiring soon, attempt refresh
            if (!session.refreshToken) {
                return NextResponse.json(
                    { error: "Token expired and no refresh token available", requiresReauth: true },
                    { status: 401 }
                );
            }

            try {
                console.log("Refreshing expired/expiring token for session:", session.sessionId);

                const refreshedTokens = await refreshGoogleToken(session.refreshToken);
                const newAccessToken = refreshedTokens.access_token;
                const newExpiresAt = Date.now() + refreshedTokens.expires_in * 1000;

                // Update session in database
                const updateFields: Record<string, unknown> = {
                    accessToken: newAccessToken,
                    accessTokenExpiresAt: newExpiresAt,
                };

                // Update refresh token if a new one was provided
                if (refreshedTokens.refresh_token) {
                    updateFields.refreshToken = refreshedTokens.refresh_token;
                }

                await Session.updateOne({ _id: session._id }, { $set: updateFields });

                console.log("Token refreshed successfully for session:", session.sessionId);

                return NextResponse.json({
                    accessToken: newAccessToken,
                    refreshed: true,
                    expiresAt: newExpiresAt,
                });
            } catch (refreshError) {
                console.error("Failed to refresh token:", refreshError);
                return NextResponse.json(
                    { error: "Failed to refresh token", requiresReauth: true },
                    { status: 401 }
                );
            }
        }

        // Token is still valid, return current token
        return NextResponse.json({
            accessToken: session.accessToken,
            refreshed: false,
            expiresAt: session.accessTokenExpiresAt,
        });
    } catch (error) {
        console.error("Error in /api/auth/refresh:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
