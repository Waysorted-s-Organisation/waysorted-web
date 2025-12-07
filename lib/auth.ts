import dbConnect from "./db";
import Session from "@/models/session";
import { generateState, errorResponse } from "./utils";
import type { IUser } from "@/models/user";

interface SessionWithPkce {
  sessionId: string;
  pendingCodeVerifier?: string;
  pendingCodeState?: string;
}

/**
 * Store PKCE challenge details for a session
 */
export async function storePkceChallenge(
  email: string,
  codeVerifier: string
): Promise<string> {
  await dbConnect();

  const state = generateState();

  await Session.findOneAndUpdate(
    { sessionId: state },
    {
      $set: {
        sessionId: state,
        pendingCodeVerifier: codeVerifier,
        pendingCodeState: state,
      },
    },
    { upsert: true, new: true }
  );

  return state;
}

/**
 * Get the stored PKCE challenge details for a session
 */
export async function getPkceChallenge(
  state: string
): Promise<{ codeVerifier: string; state: string } | null> {
  await dbConnect();

  const session = (await Session.findOne({
    sessionId: state,
  }).lean()) as SessionWithPkce | null;

  if (!session || !session.pendingCodeVerifier) {
    return null;
  }

  return {
    codeVerifier: session.pendingCodeVerifier,
    state: session.sessionId,
  };
}

/**
 * Clear the PKCE challenge details for a session
 */
export async function clearPkceChallenge(sessionId: string): Promise<void> {
  await dbConnect();

  await Session.findOneAndUpdate(
    { sessionId },
    {
      $unset: {
        pendingCodeVerifier: 1,
        pendingCodeState: 1,
      },
    }
  );
}

/**
 * Update session tokens
 */
export async function updateSessionTokens(
  sessionId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }
): Promise<void> {
  await dbConnect();

  await Session.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.expiresAt,
      },
    },
    { upsert: true }
  );
}

/**
 * Get user from the access token
 */
export async function getUserFromToken(token: string): Promise<IUser | null> {
  try {
    await dbConnect();
    const session = await Session.findOne({ accessToken: token }).populate<{
      user: IUser;
    }>("user");
    return session?.user || null;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

/**
 * Middleware to protect routes requiring authentication
 */
export async function authMiddleware(
  request: Request
): Promise<IUser | Response> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Unauthorized: No valid token provided", 401);
  }

  const token = authHeader.split(" ")[1];

  const user = await getUserFromToken(token);
  if (!user) {
    return errorResponse("Unauthorized: Invalid token", 401);
  }

  return user;
}
