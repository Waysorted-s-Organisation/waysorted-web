import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot } from "@/lib/billing/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const auth =
      (await getAuthenticatedUser(request)) || (await getBridgeAuthenticatedUser("billing:read"));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await buildBillingSnapshot(auth.user, request);
    return NextResponse.json({
      pricingVersion: snapshot.pricingVersion,
      pricing: snapshot.pricing,
      catalog: snapshot.catalog,
      capabilities: snapshot.capabilities,
    });
  } catch (error) {
    console.error("GET /api/billing/catalog error:", error);
    return NextResponse.json({ error: "Unable to load catalog." }, { status: 500 });
  }
}
