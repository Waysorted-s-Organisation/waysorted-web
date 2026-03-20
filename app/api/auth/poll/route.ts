import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { corsHeaders, OPTIONS } from "@/lib/cors";
export { OPTIONS };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400, headers: corsHeaders }
      );
    }

    await dbConnect();
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (session.accessToken && session.completed) {
      return NextResponse.json(
        { accessToken: session.accessToken },
        { headers: corsHeaders }
      );
    }

    // Still waiting for user to complete OAuth flow
    return NextResponse.json(
      { pending: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in /api/auth/poll:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}