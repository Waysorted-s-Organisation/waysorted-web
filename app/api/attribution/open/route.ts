import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/db";
import { normalizeUtmAttribution } from "@/lib/utm-attribution";
import AttributionVisit from "@/models/attributionVisit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID_PATTERN = /^[0-9a-f-]{36}:[0-9]{1,20}$/i;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const protocol = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol)
    .split(",")[0]
    .trim()
    .replace(/:$/, "");
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();
  return Boolean(host) && origin === `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin event rejected." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    const attribution = normalizeUtmAttribution(body.attribution);
    if (
      !UUID_PATTERN.test(visitorId) ||
      !EVENT_ID_PATTERN.test(eventId) ||
      !eventId.startsWith(`${visitorId}:`) ||
      !attribution
    ) {
      return NextResponse.json({ error: "Invalid attribution event." }, { status: 400 });
    }

    const now = new Date();
    const clientOpenedAtMs = Date.parse(attribution.capturedAt);
    const clientOpenedAt =
      Number.isFinite(clientOpenedAtMs) &&
      Math.abs(now.getTime() - clientOpenedAtMs) <= 24 * 60 * 60 * 1000
        ? new Date(clientOpenedAtMs)
        : null;

    await dbConnect();
    const result = await AttributionVisit.updateOne(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          visitorId,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium || null,
          utmCampaign: attribution.utmCampaign || null,
          utmTerm: attribution.utmTerm || null,
          utmContent: attribution.utmContent || null,
          landingPath: attribution.landingPath || null,
          clientOpenedAt,
          openedAt: now,
        },
      },
      { upsert: true },
    );

    return NextResponse.json(
      { recorded: result.upsertedCount === 1 },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("POST /api/attribution/open error:", error);
    return NextResponse.json(
      { error: "Unable to record attribution event." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
