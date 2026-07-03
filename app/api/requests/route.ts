import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { saveAttachmentsFromFormData, parseString, type SavedAttachment } from "@/lib/attachments";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";
import Session from "@/models/session";
import { refreshGoogleToken } from "@/lib/token";
import type { IUser } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionWithUser = {
  _id: string;
  sessionId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  user?: IUser | null;
};

function toCurrentUser(user: IUser) {
  const initials =
    user.name
      ?.split(/\s+/)
      .map((s: string) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || user.email.slice(0, 2).toUpperCase();

  return {
    id: typeof user._id === "string" ? user._id : user._id.toString(),
    name: user.name ?? null,
    email: user.email,
    picture: user.picture ?? null,
    favorites: user.favorites ?? [],
    earlyAccess: !!user.earlyAccess,
    initials,
    creditsRemaining: user.creditsRemaining ?? 0,
    role: user.role || "user",
  };
}

async function getCurrentUserFromRequest(req: NextRequest) {
  // Primary path for website usage.
  const cookieUser = await getCurrentUser();
  if (cookieUser) return cookieUser;

  // Plugin path: bearer access token.
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  // Plugin fallback path: explicit sessionId passed as query/header.
  const querySessionId = req.nextUrl.searchParams.get("sessionId")?.trim() || "";
  const headerSessionId = req.headers.get("x-session-id")?.trim() || "";
  const sessionId = querySessionId || headerSessionId;

  if (!bearerToken && !sessionId) {
    return null;
  }

  await dbConnect();

  let session = null as SessionWithUser | null;

  if (bearerToken) {
    session = (await Session.findOne({ accessToken: bearerToken })
      .populate<{ user: IUser }>("user")
      .lean()) as SessionWithUser | null;
  }

  if (!session && sessionId) {
    session = (await Session.findOne({ sessionId })
      .populate<{ user: IUser }>("user")
      .lean()) as SessionWithUser | null;
  }

  if (!session || !session.user) {
    return null;
  }

  // Keep bearer-token auth resilient to near-expiry tokens.
  if (bearerToken && session.accessTokenExpiresAt && Date.now() > session.accessTokenExpiresAt - 60000) {
    if (session.refreshToken) {
      try {
        const refreshedTokens = await refreshGoogleToken(session.refreshToken);
        const newAccessToken = refreshedTokens.access_token;
        const newAccessTokenExpiresAt = Date.now() + refreshedTokens.expires_in * 1000;

        const updateFields: Record<string, unknown> = {
          accessToken: newAccessToken,
          accessTokenExpiresAt: newAccessTokenExpiresAt,
        };
        if (refreshedTokens.refresh_token) {
          updateFields.refreshToken = refreshedTokens.refresh_token;
        }

        await Session.updateOne({ _id: session._id }, { $set: updateFields });
      } catch (refreshError) {
        console.error("Failed to refresh token for /api/requests:", refreshError);
        // Do not fail the request - extend local token lifetime instead
        const newExpiresAt = Date.now() + 3600 * 1000;
        await Session.updateOne({ _id: session._id }, { $set: { accessTokenExpiresAt: newExpiresAt } });
      }
    } else {
      // No refresh token, extend local token lifetime
      const newExpiresAt = Date.now() + 3600 * 1000;
      await Session.updateOne({ _id: session._id }, { $set: { accessTokenExpiresAt: newExpiresAt } });
    }
  }

  return toCurrentUser(session.user);
}

function buildQuery(searchParams: URLSearchParams) {
  const query: Record<string, unknown> = { isDeleted: false };
  const type = searchParams.get("type");
  const board = searchParams.get("board");
  const status = searchParams.get("status");
  const search = (searchParams.get("q") || "").trim();
  if (type) query.type = type;
  if (board) query.board = board;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { board: { $regex: search, $options: "i" } },
    ];
  }
  return query;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const query = buildQuery(url.searchParams);
    const sortParam = url.searchParams.get("sort");
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortParam === "votes") {
      sortOption = { votes: -1, createdAt: -1 };
    }

    // Check if user is admin
    const user = await getCurrentUserFromRequest(req);
    const isAdmin = user?.role === "admin";

    // Non-admin users (including unauthenticated) should only see public requests
    if (!isAdmin) {
      query.isPublic = true;
    }

    const data = await FeatureRequest.find(query).sort(sortOption);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/requests error", err);
    return NextResponse.json(
      { message: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

async function parseCreatePayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const title = parseString(formData.get("title")).trim();
    if (!title) throw new Error("Title is required");

    const description = parseString(formData.get("description"));
    const type = parseString(formData.get("type") || formData.get("requestType") || "feature");
    const board = parseString(formData.get("board"));

    let attachments: SavedAttachment[] = [];
    try {
      attachments = await saveAttachmentsFromFormData(formData);
    } catch (err) {
      // In environments with read-only filesystems (e.g., some serverless hosts),
      // attachment writes can fail. We still accept the request without files.
      console.warn("Attachment upload skipped:", err);
      attachments = [];
    }

    return { title, description, type, board, attachments } as {
      title: string;
      description: string;
      type: string;
      board: string;
      attachments: SavedAttachment[];
    };
  }

  const body = await req.json();
  if (!body?.title) throw new Error("Title is required");
  return {
    title: body.title,
    description: body.description || "",
    type: body.type || "feature",
    board: body.board || "",
    attachments: (body.attachments as SavedAttachment[]) || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    console.log("[POST /api/requests] user:", user ? user.email : "null");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized - please log in again" }, { status: 401 });
    }

    const payload = await parseCreatePayload(req);

    await dbConnect();
    const doc = await FeatureRequest.create({
      title: payload.title,
      description: payload.description,
      type: payload.type,
      board: payload.board,
      attachments: payload.attachments,
      authorId: user.id,
      authorName: user.name || user.email,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    console.error("POST /api/requests error", err);
    const message = err instanceof Error ? err.message : "Failed to create request";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
