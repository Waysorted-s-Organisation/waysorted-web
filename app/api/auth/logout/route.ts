import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth-cookies";
export { OPTIONS } from "@/lib/cors";

export async function POST() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
    return res;
  } catch (e) {
    console.error("Logout error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
