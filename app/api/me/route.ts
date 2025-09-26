import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import type { IUser } from "@/models/user";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await dbConnect();

    // Fetch session and populate user
    const session = await Session.findOne({ sessionId }).populate("user");

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = session.user as IUser;

    // Compute initials dynamically
    const initials =
      user.name
        ?.split(/\s+/)
        .map((s) => s[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || user.email.slice(0, 2).toUpperCase();

    // Handle credits for admin
    const creditsRemaining = user.creditsRemaining;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        picture: user.picture,
        favorites: user.favorites || [],
        earlyAccess: user.earlyAccess,
        initials,
        creditsRemaining,
      },
    });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
