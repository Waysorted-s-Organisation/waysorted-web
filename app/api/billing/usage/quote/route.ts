import { NextRequest, NextResponse } from "next/server";
import { resolveUsageCredits, type UsagePricingRequest } from "@/lib/billing/usagePricing";
import { billingErrorResponse } from "@/lib/billing/http-errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as UsagePricingRequest;
    const resolved = resolveUsageCredits({
      ...body,
      selectedOptions: {
        ...(body.selectedOptions || {}),
        isQuote: true,
      },
    });

    return NextResponse.json({
      ok: true,
      creditsRequired: resolved.creditsRequired,
      featureCode: resolved.featureCode,
      sizeBucket: resolved.sizeBucket,
      requiresSubscription: resolved.requiresSubscription,
      selectedOptions: resolved.selectedOptions,
    });
  } catch (error) {
    console.error("POST /api/billing/usage/quote error:", error);
    return billingErrorResponse(error, "Unable to quote usage.", "usage_quote_failed");
  }
}
