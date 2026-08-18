import type { NextRequest } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";

const OPAQUE_ORIGIN = "null";

export function isOpaqueFigmaPluginRequest(request: Request) {
  return request.headers.get("origin")?.trim() === OPAQUE_ORIGIN;
}

/**
 * Figma plugin UI runs in an iframe with an opaque (`null`) origin. Permit that
 * origin only for this bearer-token endpoint and never enable credentials.
 */
export function buildFigmaPatCorsHeaders(request: NextRequest) {
  if (isOpaqueFigmaPluginRequest(request)) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    } as const;
  }

  return buildCorsHeaders(request);
}
