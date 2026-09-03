import { NextRequest, NextResponse } from "next/server";
import AttributionCampaign from "@/models/attributionCampaign";
import { requireAdminUser } from "@/lib/billing/auth";
import {
  buildAttributionCampaignUrl,
  normalizeAttributionCampaignInput,
} from "@/lib/attribution-campaigns";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function appBaseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  try {
    return new URL(configured || request.nextUrl.origin).origin;
  } catch {
    return request.nextUrl.origin;
  }
}

function serializeCampaign(
  campaign: {
    _id: unknown;
    name: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    destinationPath: string;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  },
  baseUrl: string,
) {
  return {
    id: String(campaign._id),
    name: campaign.name,
    utmSource: campaign.utmSource,
    utmMedium: campaign.utmMedium,
    utmCampaign: campaign.utmCampaign,
    destinationPath: campaign.destinationPath,
    active: campaign.active,
    url: buildAttributionCampaignUrl(baseUrl, campaign),
    createdAt: campaign.createdAt?.toISOString() || null,
    updatedAt: campaign.updatedAt?.toISOString() || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const baseUrl = appBaseUrl(request);
    const campaigns = await AttributionCampaign.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { campaigns: campaigns.map((campaign) => serializeCampaign(campaign, baseUrl)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("GET /api/admin/attribution/campaigns error:", error);
    return NextResponse.json({ error: "Unable to load attribution campaigns." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const input = normalizeAttributionCampaignInput(await request.json().catch(() => null));
    const campaign = await AttributionCampaign.create({
      ...input,
      active: true,
      createdBy: admin.user._id,
    });

    return NextResponse.json(
      { campaign: serializeCampaign(campaign, appBaseUrl(request)) },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { error: "A campaign with this source and campaign value already exists." },
        { status: 409 },
      );
    }
    if (error instanceof Error && /Campaign|Source|Destination/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/admin/attribution/campaigns error:", error);
    return NextResponse.json({ error: "Unable to create attribution campaign." }, { status: 500 });
  }
}
