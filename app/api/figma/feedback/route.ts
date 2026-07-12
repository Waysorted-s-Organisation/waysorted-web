import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import type { IUser } from "@/types/user";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Support both cookie-based sessionId and Bearer accessToken for plugin flexibility
    const cookieStore = await cookies();
    const cookieSessionId = cookieStore.get("sessionId")?.value;

    let authToken: string | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      authToken = authHeader.split(" ")[1];
    }

    await dbConnect();

    // Authenticate the user/session if present
    let user = null;
    let sessionId = null;
    if (cookieSessionId || authToken) {
      let session = cookieSessionId
        ? await Session.findOne({ sessionId: cookieSessionId }).populate<{ user: IUser }>("user")
        : null;

      if (!session && authToken) {
        session = await Session.findOne({ accessToken: authToken }).populate<{ user: IUser }>("user");
      }

      if (session) {
        user = session.user;
        sessionId = session.sessionId;
      }
    }

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database connection not ready" }, { status: 500 });
    }

    // Build feedback document
    const doc = {
      ...body,
      authId: user ? user._id.toString() : (body.authId || null),
      sessionId: sessionId || body.sessionId || null,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await db.collection("feedback").insertOne(doc);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/figma/feedback error:", error);
    return NextResponse.json({ error: "Unable to save feedback" }, { status: 500 });
  }
}
