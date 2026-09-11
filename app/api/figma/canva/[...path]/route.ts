import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import {
  buildCanvaImporterTarget,
  isAllowedCanvaImporterRoute,
  resolveCanvaImporterBackend,
} from "@/lib/canva-importer-proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 35_000;

type RouteContext = { params: Promise<{ path: string[] }> };

function jsonError(message: string, status: number, code: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function proxy(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);
  if (!auth?.user) {
    return jsonError("Your session expired. Please sign in again.", 401, "UNAUTHORIZED");
  }

  const { path: segments } = await context.params;
  const path = segments.join("/");
  if (!isAllowedCanvaImporterRoute(request.method, path)) {
    return jsonError("The requested Canva operation is not available.", 404, "NOT_FOUND");
  }

  const backend = resolveCanvaImporterBackend(process.env.CANVA_IMPORTER_BACKEND_URL);
  const serviceToken = process.env.CANVA_IMPORTER_SERVICE_TOKEN?.trim();
  if (!backend) {
    return jsonError("The Canva importer is not configured.", 503, "CANVA_IMPORTER_NOT_CONFIGURED");
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return jsonError("The Canva request is too large.", 413, "REQUEST_TOO_LARGE");
  }

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BYTES) {
      return jsonError("The Canva request is too large.", 413, "REQUEST_TOO_LARGE");
    }
  }

  const target = buildCanvaImporterTarget(backend, path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        Accept: request.headers.get("accept") || "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(serviceToken ? { "X-Waysorted-Service-Token": serviceToken } : {}),
      },
      body,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    const etag = upstream.headers.get("etag");
    if (etag) headers.set("ETag", etag);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("Canva importer proxy failed:", timedOut ? "upstream timeout" : error);
    return jsonError(
      timedOut ? "The Canva importer timed out. Please retry." : "The Canva importer is temporarily unavailable.",
      timedOut ? 504 : 502,
      timedOut ? "CANVA_IMPORTER_TIMEOUT" : "CANVA_IMPORTER_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
