import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";

const HIDDEN_BILLING_PATHS = new Set([
  "/pricing",
  "/billing",
  "/payment",
  "/api/billing/public-catalog",
]);
const BILLING_TEST_COOKIE = "ws_billing_preview";

function isHiddenBillingPath(pathname: string) {
  return HIDDEN_BILLING_PATHS.has(pathname);
}

function guardHiddenBillingRoutes(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (process.env.NODE_ENV !== "production" || !isHiddenBillingPath(pathname)) {
    return null;
  }

  const configuredToken = process.env.BILLING_TEST_ACCESS_TOKEN?.trim();
  const bridgeToken = searchParams.get("bridge");
  const isBridgeCheckout = Boolean(bridgeToken) && (pathname === "/billing" || pathname === "/payment");

  if (isBridgeCheckout) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  if (!configuredToken) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  const accessToken = searchParams.get("billingAccess")?.trim();
  const cookieToken = request.cookies.get(BILLING_TEST_COOKIE)?.value;

  if (cookieToken === configuredToken) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  if (accessToken === configuredToken) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("billingAccess");
    const response = NextResponse.redirect(url, 307);
    response.cookies.set(BILLING_TEST_COOKIE, configuredToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 6,
    });
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Enforce www in production (Single-hop redirect)
  if (
    process.env.NODE_ENV === "production" &&
    hostname === "waysorted.com"
  ) {
    const url = request.nextUrl.clone();
    url.hostname = "www.waysorted.com";
    return NextResponse.redirect(url, 301);
  }

  const billingGuardResponse = guardHiddenBillingRoutes(request);
  if (billingGuardResponse) {
    return billingGuardResponse;
  }

  // Handle CORS preflight requests (API only)
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const headers = buildCorsHeaders(request);
    if (!headers) {
      return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, {
      status: 200,
      headers,
    });
  }

  // For other requests, continue to the route handler
  // but add CORS headers to the response
  const response = NextResponse.next();

  if (pathname.startsWith("/api/")) {
    const corsHeaders = buildCorsHeaders(request);
    Object.entries(corsHeaders || {}).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Run middleware on all paths except static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
