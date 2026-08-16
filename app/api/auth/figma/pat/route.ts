import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";
import type { IUser } from "@/types/user";
import { REQUIRED_FIGMA_SCOPES, validateFigmaToken } from "@/lib/figma-auth";
import {
  buildFigmaPatCorsHeaders,
  isOpaqueFigmaPluginRequest,
} from "@/lib/figma-plugin-cors";

function withPatCors(request: NextRequest, response: NextResponse) {
  const headers = buildFigmaPatCorsHeaders(request);
  if (!headers) return response;

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function patJson(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
) {
  return withPatCors(request, NextResponse.json(body, init));
}

export async function OPTIONS(request: NextRequest) {
  const headers = buildFigmaPatCorsHeaders(request);
  return new NextResponse(null, {
    status: headers ? 200 : 403,
    headers: headers || undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Support both cookie-based sessionId and Bearer accessToken for plugin flexibility
    const authHeader = request.headers.get("Authorization");
    const authToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim() || null
      : null;
    const isOpaquePluginRequest = isOpaqueFigmaPluginRequest(request);

    // Opaque origins are accepted only with explicit bearer authentication.
    // Never authenticate a `null`-origin request through browser cookies.
    const cookieStore = await cookies();
    const cookieSessionId = isOpaquePluginRequest
      ? null
      : cookieStore.get("sessionId")?.value;

    if (!cookieSessionId && !authToken) {
      return patJson(request, { error: "Unauthorized" }, { status: 401 });
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
      return patJson(request, { error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const pat = body.pat;
    if (!pat || typeof pat !== "string") {
      return patJson(
        request,
        { error: "Missing or invalid Personal Access Token" },
        { status: 400 },
      );
    }

    const trimmedPat = pat.trim();
    // Saving a credential must not depend on a specific file being reachable.
    // File/comment access is validated by the comments endpoint when comments
    // are loaded. Coupling it here caused valid PATs to fail with a 502 when
    // Figma returned a transient error, rate limit, or inaccessible-file error.
    const validation = await validateFigmaToken(trimmedPat);

    if (!validation.ok) {
      const isInvalidCredential = validation.status === 401 || validation.status === 403;
      const message = isInvalidCredential
        ? "Invalid or expired Figma Personal Access Token."
        : "Unable to validate Figma Personal Access Token. Please try again.";

      return patJson(
        request,
        {
          error: message,
          reason: isInvalidCredential
            ? "pat_invalid_or_expired"
            : "figma_unreachable",
        },
        { status: isInvalidCredential ? 400 : 503 },
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

    return patJson(request, { success: true });
  } catch (error) {
    console.error("Figma PAT API Error:", error);
    return patJson(request, { error: "Internal server error" }, { status: 500 });
  }
}
