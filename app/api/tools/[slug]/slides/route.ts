import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/toolsdb";
import Slide from "@/models/slide";

export const runtime = "nodejs";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  // Use a permissive type for the second param to avoid Next's generated type mismatch
  await dbConnect();

  const rawSlug = context?.params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] ?? "" : rawSlug ?? "";

  const slides = await Slide.find({
    toolName: { $regex: `^${slug}$`, $options: "i" }
  }).sort({ order: 1, createdAt: 1 });

  return NextResponse.json({ slides });
}