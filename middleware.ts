import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { buildFigmaPatCorsHeaders } from "@/lib/figma-plugin-cors";
import { LEGACY_PRICING_COUNTRY_COOKIE } from "@/lib/billing/regional-pricing";
import { isNonCanonicalHost } from "@/lib/canonical-host";

const PAGE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};
const API_NO_STORE_HEADERS = {
  ...PAGE_NO_STORE_HEADERS,
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function applyHeaders(response: NextResponse, headers: Record<string, string>) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function clearLegacyPricingCountryCookie(request: NextRequest, response: NextResponse) {
  if (request.cookies.has(LEGACY_PRICING_COUNTRY_COOKIE)) {
    response.cookies.delete(LEGACY_PRICING_COUNTRY_COOKIE);
  }
  return response;
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

  // Handle CORS preflight requests (API only)
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    // Middleware runs before route handlers, so the Figma PAT endpoint's
    // opaque-origin policy must also be applied here.
    const headers = pathname === "/api/auth/figma/pat"
      ? buildFigmaPatCorsHeaders(request)
      : buildCorsHeaders(request);
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

  if (
    pathname.startsWith("/api/billing/") ||
    pathname.startsWith("/api/admin/billing/")
  ) {
    applyHeaders(response, API_NO_STORE_HEADERS);
  } else if (pathname === "/billing" || pathname === "/payment") {
    // These render account-specific state and must never be cached.
    applyHeaders(response, PAGE_NO_STORE_HEADERS);
  }
  // /pricing is deliberately absent: its HTML shell is static and identical for every visitor
  // (prices come from the no-store /api/billing/public-catalog call the client makes after
  // hydration), so forcing no-store only cost every visitor a full round trip for identical markup.
  // Re-add it if regional pricing is ever moved into the server render.

  // Keep preview/alternate hosts out of the index entirely. Applied last so it
  // wins over anything set above, and only for non-canonical hosts - the
  // production site is never touched by this branch.
  if (isNonCanonicalHost(hostname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return clearLegacyPricingCountryCookie(request, response);
}

// Run middleware on all paths except static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
