import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { refreshGoogleToken } from "@/lib/token";
import axios from "axios";
export { OPTIONS } from "@/lib/cors";

interface SessionDoc {
    _id: string;
    sessionId: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    user?: any;
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
            let refreshToken = session.refreshToken;

            if (!refreshToken && session.user) {
                console.log("Session is missing refreshToken. Searching fallbacks for user:", session.user);
                const prevSession = await Session.findOne({
                    user: session.user,
                    refreshToken: { $exists: true, $ne: null }
                }).sort({ completedAt: -1 }).lean() as SessionDoc | null;
                if (prevSession?.refreshToken) {
                    refreshToken = prevSession.refreshToken;
                    // Persist it back to the current session so future calls are cached
                    await Session.updateOne({ _id: session._id }, { $set: { refreshToken } });
                    console.log("Successfully recovered fallback refreshToken from previous session.");
                }
            }

            if (!refreshToken) {
                return NextResponse.json(
                    { error: "Token expired and no refresh token available", requiresReauth: true },
                    { status: 401 }
                );
            }

            try {
                console.log("Refreshing expired/expiring token for session:", session.sessionId);

                const refreshedTokens = await refreshGoogleToken(refreshToken);
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

                // Differentiate between transient network failures vs. hard auth expiration
                if (axios.isAxiosError(refreshError)) {
                    const status = refreshError.response?.status;
                    const errorMsg = refreshError.response?.data?.error_description || refreshError.response?.data?.error || "";
                    console.error(`Google refresh response error code: ${status}, msg: ${errorMsg}`);

                    // Google OAuth endpoints return 400 for revoked/expired/invalid refresh tokens ("invalid_grant")
                    if (status === 400 || status === 401) {
                        return NextResponse.json(
                            { error: "Refresh token is invalid or revoked. Please log in again.", requiresReauth: true },
                            { status: 401 }
                        );
                    }
                }

                // For transient errors (network connection/timeout/Google 5xx), return a server error
                // but DO NOT signal requiresReauth, so the client doesn't wipe cached data.
                return NextResponse.json(
                    { error: "Failed to connect to Google authentication server. Please try again." },
                    { status: 503 }
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
