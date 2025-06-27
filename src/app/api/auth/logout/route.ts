import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import Session from "../../../../models/session";

/* POST /api/auth/logout
   – expects “Authorization: Bearer <access-token>”
   – deletes the corresponding Session document                     */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token supplied" }, { status: 400 });
  }

  await dbConnect();
  await Session.deleteOne({ accessToken: token }); // remove the session row

  return NextResponse.json({ message: "Logged out" }, { status: 200 });
}

/* CORS pre-flight (same as in the other files) */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
