import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot } from "@/lib/billing/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const billing = await buildBillingSnapshot(auth.user);

    return NextResponse.json({
      id: String(auth.user._id),
      _id: auth.user._id,
      name: auth.user.name,
      email: auth.user.email,
      picture: auth.user.picture,
      favorites: auth.user.favorites || [],
      earlyAccess: billing.capabilities.customizablePresets || Boolean(auth.user.earlyAccess),
      creditsRemaining: billing.wallet.availableCredits,
      role: auth.user.role || "user",
      billing,
    });
  } catch (error) {
    console.error("Error in /api/user/profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
