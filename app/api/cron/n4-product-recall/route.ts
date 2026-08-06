import { NextRequest, NextResponse } from "next/server";
import {
  N4CanarySimulationError,
  produceN4CanarySimulation,
  produceN4InactivityEvents,
} from "@/lib/n4-product-recall";
import { validateN4CanaryTestTarget } from "@/lib/n4-canary-test";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(
    secret
    && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await produceN4InactivityEvents());
  } catch (error) {
    console.error("N4 inactivity scan failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "N4 inactivity scan failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const target = validateN4CanaryTestTarget({
    enabled: process.env.NOTIFICATION_N4_CANARY_TEST_ENABLED,
    allowlist: process.env.NOTIFICATION_N4_PRODUCER_CANARY_EMAILS,
    requestedEmail: body?.email,
  });
  if (!target.ok) {
    return NextResponse.json(
      { error: target.error },
      { status: target.status },
    );
  }

  try {
    return NextResponse.json(await produceN4CanarySimulation(target.email));
  } catch (error) {
    if (error instanceof N4CanarySimulationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("N4 canary simulation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "N4 canary simulation failed" },
      { status: 500 },
    );
  }
}
