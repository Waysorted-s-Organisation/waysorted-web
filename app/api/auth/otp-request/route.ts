import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OtpRequest from "@/models/otpRequest";

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

    const ttlSeconds = typeof expires_in === "number" && expires_in > 0 ? expires_in : 10 * 60;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await OtpRequest.findOneAndUpdate(
      { requestId: request_id },
      {
        requestId: request_id,
        email: String(email).trim().toLowerCase(),
        name: name ? String(name).trim() : undefined,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/otp-request error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}