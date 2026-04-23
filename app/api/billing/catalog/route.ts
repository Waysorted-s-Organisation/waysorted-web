import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot } from "@/lib/billing/db";

export async function GET(request: NextRequest) {
  try {
    const bridgeToken = request.nextUrl.searchParams.get("bridge");
    const auth =
      (await getAuthenticatedUser(request)) || (await getBridgeAuthenticatedUser(bridgeToken));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await buildBillingSnapshot(auth.user);
    return NextResponse.json({
      pricingVersion: snapshot.pricingVersion,
      catalog: snapshot.catalog,
      capabilities: snapshot.capabilities,
    });
  } catch (error) {
    console.error("GET /api/billing/catalog error:", error);
    return NextResponse.json({ error: "Unable to load catalog." }, { status: 500 });
  }
}
