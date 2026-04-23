import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Session from "@/models/session";
import type { IUser } from "@/types/user";
import { buildBillingSnapshot } from "@/lib/billing/db";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await dbConnect();

    // Fetch session and populate user
    const session = await Session.findOne({ sessionId }).populate<{ user: IUser }>("user");

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = session.user;

    const billing = await buildBillingSnapshot(user);

    const initials =
      user.name
        ?.split(/\s+/)
        .map((s) => s[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || user.email.slice(0, 2).toUpperCase();

    // Check for active integrations (Figma)
    // We look for any session for this user that has source='figma' or 'plugin' 
    // and has a refresh token (meaning it's a persistent connection)
    const figmaSession = await Session.findOne({
      user: user._id,
      source: { $in: ["figma", "plugin"] },
      refreshToken: { $exists: true, $ne: null }
    });

    const isFigmaConnected = !!figmaSession;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        picture: user.picture,
        favorites: user.favorites || [],
        earlyAccess: billing.capabilities.customizablePresets || Boolean(user.earlyAccess),
        initials,
        creditsRemaining: billing.wallet.availableCredits,
        integrations: {
          figma: isFigmaConnected
        },
        role: user.role,
        billing,
      },
    });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
