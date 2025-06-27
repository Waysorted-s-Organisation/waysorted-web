import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import Session from "../../../../models/session";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    await dbConnect();

    const session = await Session.findOne({ accessToken: token })
      .populate("user", "name email picture favorites")
      .lean();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(session.user);
  } catch (error) {
    console.error("Error in /api/user/profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
