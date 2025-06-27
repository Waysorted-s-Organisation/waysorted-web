import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import Session from "../../../../models/session";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token supplied" }, { status: 400 });
  }

  await dbConnect();
  await Session.deleteOne({ accessToken: token });

  return NextResponse.json({ message: "Logged out" });
}
