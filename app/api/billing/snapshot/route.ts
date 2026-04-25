import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot } from "@/lib/billing/db";

function getInitials(name: string | undefined, email: string) {
  return (
    name
      ?.split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || email.slice(0, 2).toUpperCase()
  );
}

export async function GET(request: NextRequest) {
  try {
    const bridgeToken = request.nextUrl.searchParams.get("bridge");
    const auth =
      (await getAuthenticatedUser(request)) || (await getBridgeAuthenticatedUser(bridgeToken));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await buildBillingSnapshot(auth.user, request);

    return NextResponse.json({
      id: String(auth.user._id),
      name: auth.user.name,
      email: auth.user.email,
      picture: auth.user.picture,
      favorites: auth.user.favorites || [],
      creditsRemaining: snapshot.wallet.availableCredits,
      earlyAccess: snapshot.capabilities.customizablePresets,
      initials: getInitials(auth.user.name, auth.user.email),
      role: auth.user.role || "user",
      billing: snapshot,
    });
  } catch (error) {
    console.error("GET /api/billing/snapshot error:", error);
    return NextResponse.json({ error: "Unable to load billing snapshot." }, { status: 500 });
  }
}
