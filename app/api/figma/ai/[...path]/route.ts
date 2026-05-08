import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import type { IUser } from "@/types/user";

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

async function handleProxy(request: Request, params: { path: string[] }) {
  const { searchParams } = new URL(request.url);

  // Authentication
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

  let session = cookieSessionId
    ? await Session.findOne({ sessionId: cookieSessionId }).populate<{ user: IUser }>("user")
    : null;

  if (!session && authToken) {
    session = await Session.findOne({ accessToken: authToken }).populate<{ user: IUser }>("user");
  }

  if (!session || !session.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const user = session.user;

  // Build the target URL for the AI backend
  const targetPath = params.path.join("/");
  const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
  const searchString = searchParams.toString();
  const targetUrl = `${backendUrl.replace(/\/$/, "")}/${targetPath}${searchString ? `?${searchString}` : ""}`;

  try {
    const headers = new Headers();
    // Copy safe headers from original request if needed (like Content-Type)
    const contentType = request.headers.get("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // Inject AI Server credentials
    const pluginToken = process.env.AI_PLUGIN_TOKEN;
    if (pluginToken) {
      headers.set("x-plugin-token", pluginToken);
    }

    // Inject Actor identity from request headers (Figma user) or fallback to waysorted-web user
    const reqActorId = request.headers.get("x-actor-id");
    const reqActorHandle = request.headers.get("x-actor-handle");

    if (reqActorId) {
      headers.set("x-actor-id", reqActorId);
    } else {
      headers.set("x-actor-id", user._id.toString());
    }

    if (reqActorHandle) {
      headers.set("x-actor-handle", reqActorHandle);
    } else {
      // Use user name or email prefix as handle if available, else just string representation of ID
      const userHandle =
        user.name ||
        (user.email ? user.email.split("@")[0] : user._id.toString());
      headers.set("x-actor-handle", userHandle);
    }

    let body = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text(); // Get raw body text
    }

    const aiRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await aiRes.text();

    return new NextResponse(responseBody, {
      status: aiRes.status,
      headers: {
        "Content-Type": aiRes.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: "Internal server error connecting to AI backend" }, { status: 500 });
  }
}
