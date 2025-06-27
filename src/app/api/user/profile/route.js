import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import Session from "../../../../models/session";

// Utility to add CORS headers to any response
function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return withCors(
        NextResponse.json({ error: "No token" }, { status: 401 })
      );
    }

    const token = authHeader.replace("Bearer ", "");

    await dbConnect();

    const session = await Session.findOne({ accessToken: token })
      .populate("user", "name email picture favorites")
      .lean();

    if (!session || !session.user) {
      return withCors(
        NextResponse.json({ error: "Invalid token" }, { status: 401 })
      );
    }

    return withCors(NextResponse.json(session.user, { status: 200 }));
  } catch (error) {
    console.error("Error in /api/user/profile:", error);
    return withCors(
      NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
