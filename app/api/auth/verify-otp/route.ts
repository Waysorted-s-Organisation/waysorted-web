import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import Session from "@/models/session";
import OtpRequest from "@/models/otpRequest";

// Use server-side env for the provider verify URL
const PROVIDER_VERIFY_URI =
  process.env.VERIFY_URI || process.env.NEXT_PUBLIC_VERIFY_URI;

if (!PROVIDER_VERIFY_URI) {
  throw new Error("VERIFY_URI not configured.");
}

export async function POST(req: Request) {
  try {
    const { request_id, otp } = await req.json();

    if (!request_id || !otp) {
      return NextResponse.json(
        { ok: false, message: "request_id and otp are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1) Resolve the email (and name) we saved for this request_id
    const mapping = await OtpRequest.findOne({ requestId: request_id });
    if (!mapping) {
      return NextResponse.json(
        { ok: false, message: "Unknown or expired request_id" },
        { status: 400 }
      );
    }
    if (mapping.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, message: "OTP expired" }, { status: 400 });
    }

    const email = mapping.email;
    const name = mapping.name;

    // 2) Verify with your provider
    const provRes = await fetch(PROVIDER_VERIFY_URI as string, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      // If your provider requires email too, include it:
      body: JSON.stringify({ request_id, otp, email }),
    });

    const provText = await provRes.text();
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provData: any = null;
    try {
      provData = provText ? JSON.parse(provText) : null;
    } catch {
      // non-JSON response
    }
    if (!provRes.ok) {
      return NextResponse.json(
        { ok: false, message: provData?.message || provData?.error || provText || "Invalid OTP" },
        { status: provRes.status }
      );
    }

    // 3) Upsert the user with name and email
    const normalizedEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: name ? String(name).trim() : undefined,
      });
    } else if (name && !user.name) {
      // Only set name if it's currently empty; change this rule as desired
      user.name = String(name).trim();
      await user.save();
    }

    // 4) Create a session and set the cookie your /api/me expects (sessionId)
    const sessionId = crypto.randomUUID();
    const maxAgeDays = 30;
    const expiresAt = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);

    await Session.create({
      sessionId,
      user: user._id,
      expiresAt,
    });

    // Optionally, cleanup this request mapping now that it's used
    // await OtpRequest.deleteOne({ requestId: request_id });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });

    res.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
      maxAge: maxAgeDays * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("POST /api/auth/verify-otp error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}