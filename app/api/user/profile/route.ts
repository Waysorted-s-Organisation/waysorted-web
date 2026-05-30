import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot } from "@/lib/billing/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    console.log("=== PROFILE API ===");
    console.log("auth.user.email:", auth.user.email);
    console.log("auth.user.createdAt:", auth.user.createdAt);
    console.log("auth.user.createdAt type:", typeof auth.user.createdAt);

    const billing = await buildBillingSnapshot(auth.user, request);

    const isNewUser = auth.user.createdAt
      ? Date.now() - new Date(auth.user.createdAt).getTime() < 5 * 60 * 1000
      : false;

    console.log("isNewUser calculated:", isNewUser);

    return NextResponse.json({
      id: String(auth.user._id),
      _id: auth.user._id,
      name: auth.user.name,
      email: auth.user.email,
      picture: auth.user.picture,
      favorites: auth.user.favorites || [],
      earlyAccess: Boolean(auth.user.earlyAccess),
      creditsRemaining: billing.wallet.availableCredits,
      role: auth.user.role || "user",
      isNewUser,
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
