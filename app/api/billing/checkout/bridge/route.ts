import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { createSignedToken } from "@/lib/billing/crypto";
import { getBridgeSecret } from "@/lib/billing/env";

type BridgeRequestBody = {
  productCode?: string;
  returnPath?: string;
  source?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as BridgeRequestBody;
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const bridgeToken = createSignedToken(
      {
        userId: String(auth.user._id),
        email: auth.user.email,
        productCode: body.productCode?.trim() || null,
        returnPath: body.returnPath?.trim() || "/billing",
        source: body.source?.trim() || auth.authType,
        issuedAt: new Date().toISOString(),
        expiresAt,
      },
      getBridgeSecret(),
    );

    const url = new URL("/billing", request.nextUrl.origin);
    url.searchParams.set("bridge", bridgeToken);
    if (body.productCode?.trim()) {
      url.searchParams.set("product", body.productCode.trim());
    }

    return NextResponse.json({
      bridgeToken,
      expiresAt,
      url: url.toString(),
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/bridge error:", error);
    return NextResponse.json({ error: "Unable to create checkout bridge." }, { status: 500 });
  }
}
