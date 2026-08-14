import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import BillingBridgeGrant from "@/models/billingBridgeGrant";
import { createSignedToken } from "@/lib/billing/crypto";
import { getBridgeSecret } from "@/lib/billing/env";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  await dbConnect();
  const code = request.nextUrl.searchParams.get("code")?.trim() || "";
  if (!code) return NextResponse.json({ error: "Missing checkout code." }, { status: 400 });

  const now = new Date();
  const codeHash = createHash("sha256").update(code).digest("hex");
  const grant = await BillingBridgeGrant.findOneAndUpdate(
    { codeHash, consumedAt: null, expiresAt: { $gt: now } },
    { $set: { consumedAt: now } },
    { new: true },
  );
  if (!grant) {
    return NextResponse.json({ error: "Checkout link expired or already used." }, { status: 410 });
  }

  const expiresAt = new Date(Date.now() + 15 * 60_000);
  const token = createSignedToken({
    userId: String(grant.user),
    aud: "billing_checkout",
    scopes: ["billing:read", "billing:checkout"],
    jti: randomUUID(),
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }, getBridgeSecret());

  const target = new URL(grant.returnPath.startsWith("/") ? grant.returnPath : "/billing", request.nextUrl.origin);
  if (grant.productCode) {
    target.searchParams.set("product", grant.productCode);
    target.searchParams.set("autostart", "1");
  }
  const response = NextResponse.redirect(target);
  response.cookies.set("waysortedBillingBridge", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/billing",
    expires: expiresAt,
  });
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
