import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { OPTIONS, withCors } from "@/lib/cors";
export { OPTIONS };

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
      return withCors(request, NextResponse.json({ accessToken: session.accessToken }));
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
      return withCors(request, NextResponse.json({ accessToken: session.accessToken }));
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
