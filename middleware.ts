import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { LEGACY_PRICING_COUNTRY_COOKIE } from "@/lib/billing/regional-pricing";

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

  if (
    pathname.startsWith("/api/billing/") ||
    pathname.startsWith("/api/admin/billing/")
  ) {
    applyHeaders(response, API_NO_STORE_HEADERS);
  } else if (pathname === "/pricing" || pathname === "/billing" || pathname === "/payment") {
    applyHeaders(response, PAGE_NO_STORE_HEADERS);
  }

  return clearLegacyPricingCountryCookie(request, response);
}

// Run middleware on all paths except static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
