import { NextRequest, NextResponse } from "next/server";

/**
 * CORS headers for cross-origin requests (e.g., from Figma plugins)
 * Exportable for use in individual route handlers
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Id",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
};

/**
 * OPTIONS handler for preflight requests
 * Export this from route files that need CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * CORS middleware for API routes
 * Sets appropriate CORS headers for cross-origin requests
 */
export function cors(req: NextRequest): NextResponse | null {
  const headers = new Headers();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers });
  }
  return null;
}

/**
 * Apply CORS headers to a response
 */
export function withCors(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export default cors;
