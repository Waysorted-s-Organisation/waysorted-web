import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import type { IUser } from "@/types/user";
import { refreshGoogleToken } from "@/lib/token";
import User from "@/models/user";
import { getBridgeSecret } from "@/lib/billing/env";
import { verifySignedToken } from "@/lib/billing/crypto";

type SessionWithUser = {
  _id: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  source?: string;
  user?: IUser;
};

async function findBearerSession(accessToken: string) {
  return (await Session.findOne({ accessToken })
    .populate<{ user: IUser }>("user")
    .lean()) as SessionWithUser | null;
}

export async function getAuthenticatedUser(request?: NextRequest) {
  await dbConnect();

  const authHeader = request?.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";

  if (bearerToken) {
    const session = await findBearerSession(bearerToken);
    if (session?.user) {
      return {
        session,
        user: session.user,
        authType: "bearer" as const,
      };
    }
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) return null;

  const session = await Session.findOne({ sessionId }).populate<{ user: IUser }>("user").lean();
  if (!session?.user) return null;

  return {
    session,
    user: session.user,
    authType: "cookie" as const,
  };
}

export async function requireAdminUser(request?: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth?.user || auth.user.role !== "admin") return null;
  return auth;
}

export async function getBridgeAuthenticatedUser(bridgeToken?: string | null) {
  if (!bridgeToken) return null;

  const verified = verifySignedToken<{
    userId: string;
    email?: string;
    expiresAt: string;
  }>(bridgeToken, getBridgeSecret());

  if (!verified) return null;
  if (Date.parse(verified.payload.expiresAt) <= Date.now()) return null;

  await dbConnect();
  const user = await User.findById(verified.payload.userId).lean<IUser | null>();
  if (!user) return null;

  return {
    user,
    authType: "bridge" as const,
    session: null,
    bridge: verified.payload,
  };
}
