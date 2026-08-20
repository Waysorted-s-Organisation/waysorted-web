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
    // This URL is opened as a top-level browser navigation from the Figma
    // plugin, so a JSON body renders as raw text in a tab. The grant lives 90
    // seconds; a customer who takes longer to switch to their browser saw
    // `{"error":"Checkout link expired..."}` and had nowhere to go. Send them to
    // checkout with an explanation instead.
    const expired = new URL("/billing", request.nextUrl.origin);
    expired.searchParams.set("bridge", "expired");

    // Recover the code so an expired link does not also cost the customer their
    // discount. Read WITHOUT consuming and without issuing a session: a code is
    // not authorisation - checkout re-resolves it server-side against the
    // signed-in user, their balance and the chosen plan before it can affect a
    // charge - so carrying it here only saves them retyping something they were
    // already shown.
    const stale = await BillingBridgeGrant.findOne({ codeHash }).select("couponCode productCode").lean();
    if (stale?.couponCode) expired.searchParams.set("coupon", stale.couponCode);
    if (stale?.productCode) expired.searchParams.set("product", stale.productCode);

    return NextResponse.redirect(expired);
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

  // `startsWith("/")` alone accepts protocol-relative paths like "//evil.com" and "/\evil.com",
  // which resolve to a different origin - an open redirect on waysorted.com, immediately after a
  // billing session cookie has been set.
  const isInternalPath =
    grant.returnPath.startsWith("/") &&
    !grant.returnPath.startsWith("//") &&
    !grant.returnPath.startsWith("/\\");
  const target = new URL(isInternalPath ? grant.returnPath : "/billing", request.nextUrl.origin);
  if (target.origin !== request.nextUrl.origin) {
    return NextResponse.redirect(new URL("/billing", request.nextUrl.origin));
  }
  if (grant.productCode) {
    target.searchParams.set("product", grant.productCode);
  }
  // Carried separately from the product: a modal can offer a code without
  // naming a plan, and gating this on productCode would drop the code for
  // exactly that case.
  if (grant.couponCode) {
    target.searchParams.set("coupon", grant.couponCode);
  }
  // Deliberately NO autostart.
  //
  // autostart opens Razorpay's sheet the moment the page loads. On the /pricing
  // hand-off that is safe, because the customer has just seen and clicked a
  // price there and it is carried in ?qa/?qc for the drift guard to compare
  // against. Nothing on this path shows a price first: the plugin's modal
  // advertises a percentage, not an amount, and no quote is carried, so the
  // drift guard has nothing to compare and is inert. Auto-opening here would
  // put a payment sheet in front of a customer at an amount they have never
  // been shown - and with a coupon, at an amount that depends on whether the
  // code resolves at all. They land on checkout with the code applied and press
  // Continue themselves.
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
