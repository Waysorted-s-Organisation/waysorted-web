import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/toolsdb";
import Slide from "@/models/slide";

export const runtime = "nodejs";

// Cache slides for 1 hour - data doesn't change frequently
// Cache slides for 0 seconds (disable cache) during active development
export const revalidate = 0;

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  // Use a permissive type for the second param to avoid Next's generated type mismatch
  await dbConnect();

  const params = await context?.params;
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] ?? "" : rawSlug ?? "";



  // Match both "unit-converter" and "unit-convertor" for legacy compatibility
  // Also matches exact slug
  const searchRegex = slug === 'unit-converter'
    ? /^(unit-convert(e|o)r)$/i
    : new RegExp(`^${slug}$`, 'i');

  const slides = await Slide.find({
    toolName: { $regex: searchRegex }
  }).sort({ order: 1, createdAt: 1 }).lean();

  return NextResponse.json(
    { slides },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

