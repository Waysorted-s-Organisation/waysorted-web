import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { cookies } from "next/headers";

export async function POST() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("sessionId", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    console.error("Logout error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}