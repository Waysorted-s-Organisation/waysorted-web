import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";

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

  return response;
}

// Run middleware on all paths except static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
