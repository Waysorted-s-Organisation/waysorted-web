import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await dbConnect();
    const session = await Session.findOne({ sessionId });

    if (session && session.accessToken) {
      return NextResponse.json({ accessToken: session.accessToken });
    } else {
      return NextResponse.json({});
    }
  } catch (error) {
    console.error("Error in /api/auth/poll:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
