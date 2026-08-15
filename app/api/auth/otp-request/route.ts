import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OtpRequest from "@/models/otpRequest";
export { OPTIONS } from "@/lib/cors";

/**
  Client calls this right after sending OTP via the provider and receiving { request_id, expires_in }.
  Body: { request_id: string, email: string, name?: string, expires_in?: number }
*/
export async function POST(req: Request) {
  try {
    const { request_id, email, name, expires_in } = await req.json();

    if (!request_id || !email) {
      return NextResponse.json(
        { ok: false, message: "request_id and email are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Cap the caller-supplied TTL: an attacker could otherwise keep a mapping alive indefinitely.
    const MAX_TTL_SECONDS = 15 * 60;
    const requestedTtl = typeof expires_in === "number" && expires_in > 0 ? expires_in : 10 * 60;
    const ttlSeconds = Math.min(requestedTtl, MAX_TTL_SECONDS);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const normalizedEmail = String(email).trim().toLowerCase();

    // The request_id -> email mapping is IMMUTABLE.
    //
    // verify-otp treats mapping.email as the authenticated identity and mints a 30-day session for
    // it. This route is unauthenticated, so allowing an existing mapping to be rewritten meant an
    // attacker could request an OTP for their own address, rebind that request_id to a victim's
    // email, then verify with the code they legitimately received - taking over any account,
    // including an admin. $setOnInsert makes the binding write-once.
    const existing = await OtpRequest.findOne({ requestId: request_id }).lean<{
      email?: string;
    } | null>();

    if (existing && existing.email !== normalizedEmail) {
      console.warn("[auth] rejected attempt to rebind an OTP request id to a different email", {
        requestId: String(request_id).slice(0, 12),
      });
      return NextResponse.json(
        { ok: false, message: "request_id is already in use" },
        { status: 409 }
      );
    }

    await OtpRequest.updateOne(
      { requestId: request_id },
      {
        $setOnInsert: {
          requestId: request_id,
          email: normalizedEmail,
          name: name ? String(name).trim() : undefined,
        },
        // Only the expiry may move, and never beyond the cap above.
        $set: { expiresAt },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/otp-request error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}