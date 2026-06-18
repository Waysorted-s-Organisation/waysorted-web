import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.waysorted.com",
  "https://waysorted.com",
  "https://www.figma.com",
  "https://figma.com",
  "https://d94k870h57ivk.cloudfront.net",
  "https://swipefolio.waysorted.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "null",
];

function getAllowedOrigins() {
  const configured = process.env.ALLOWED_API_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([...(configured || []), ...DEFAULT_ALLOWED_ORIGINS]);
}

export function resolveCorsOrigin(req: NextRequest) {
  const origin = req.headers.get("origin")?.trim();
  if (!origin) return null;
  return getAllowedOrigins().has(origin) ? origin : null;
}

export function buildCorsHeaders(req: NextRequest) {
  const origin = resolveCorsOrigin(req);
  if (!origin) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Session-Id, X-Waysorted-Device-Id, X-Waysorted-Callback-Signature, X-Waysorted-Processor-Token, x-actor-id, x-actor-handle",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as const;
}

export async function OPTIONS(req: NextRequest) {
  const headers = buildCorsHeaders(req);
  if (!headers) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers,
  });
}

export function cors(req: NextRequest): NextResponse | null {
  const headers = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return headers ? new NextResponse(null, { status: 200, headers }) : new NextResponse(null, { status: 403 });
  }
  return null;
}

export function withCors(req: NextRequest, response: NextResponse): NextResponse {
  const headers = buildCorsHeaders(req);
  if (!headers) return response;

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export default cors;
