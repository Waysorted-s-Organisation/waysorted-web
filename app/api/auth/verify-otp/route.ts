import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import Session from "@/models/session";
import OtpRequest from "@/models/otpRequest";
import Subscriber from "@/models/subscriber";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth-cookies";
import {
  buildAccountActivatedEvent,
  buildProductActivityResumedEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
export { OPTIONS } from "@/lib/cors";

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

    const provRes = await fetch(PROVIDER_VERIFY_URI as string, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ request_id, otp, email }),
    });

    const provText = await provRes.text();
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provData: any = null;
    try {
      provData = provText ? JSON.parse(provText) : null;
    } catch { }

    if (!provRes.ok) {
      return NextResponse.json(
        { ok: false, message: provData?.message || provData?.error || provText || "Invalid OTP" },
        { status: provRes.status }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    const isNewUser = !user;
    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: name ? String(name).trim() : undefined,
      });
    } else if (name && !user.name) {
      user.name = String(name).trim();
      await user.save();
    }

    // Auto-subscribe to newsletter
    try {
      await Subscriber.findOneAndUpdate(
        { email: normalizedEmail },
        {
          email: normalizedEmail,
          name: name ? String(name).trim() : undefined,
          status: 'active',
          source: 'otp'
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      console.error("Auto-subscription failed (OTP):", error);
    }

    // Consume the mapping so the same request_id + otp cannot mint a second session before the TTL
    // lapses. Conditional delete: if another request already consumed it, stop rather than issue a
    // duplicate session.
    const consumed = await OtpRequest.findOneAndDelete({ requestId: request_id });
    if (!consumed) {
      return NextResponse.json(
        { ok: false, message: "This code has already been used" },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();
    const maxAgeDays = 30;
    const expiresAt = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);

    await Session.create({
      sessionId,
      user: user._id,
      expiresAt,
      completed: true,
      completedAt: new Date(),
      source: "otp",
    });

    if (isNewUser) {
      await emitNotificationEvent(
        buildAccountActivatedEvent({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          provider: "otp",
        })
      );
    }


    await emitNotificationEvent(
      buildProductActivityResumedEvent({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        activityId: sessionId,
        activityType: "login",
        activitySource: "otp",
      })
    );

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });

    res.cookies.set(
      SESSION_COOKIE_NAME,
      sessionId,
      getSessionCookieOptions(maxAgeDays * 24 * 60 * 60)
    );


    return res;
  } catch (err) {
    console.error("POST /api/auth/verify-otp error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
