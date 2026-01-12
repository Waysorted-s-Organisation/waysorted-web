import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/toolsdb";
import Slide from "@/models/slide";

export const runtime = "nodejs";

// Cache slides for 1 hour - data doesn't change frequently
export const revalidate = 3600;

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  // Use a permissive type for the second param to avoid Next's generated type mismatch
  await dbConnect();

  const params = await context?.params;
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] ?? "" : rawSlug ?? "";

  if (slug === 'frames-to-pdf') {
    const slides = Array.from({ length: 8 }, (_, i) => ({
      toolName: 'Frames to PDF',
      order: i + 1,
      toolID: 'tool_frames-to-pdf',
      title: 'High-Quality PDF Exports',
      subtitle: 'Turn your designs into share-ready PDFs in seconds.',
      bullets: [
        'Maintain vector quality & text formatting',
        'One-click multi-page export',
        'Customizable layouts'
      ],
      image: `/images/frames-to-pdf/${i + 1}.png`,
      imageAlt: `Frames to PDF Slide ${i + 1}`
    }));
    return NextResponse.json(
      { slides },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }

  const slides = await Slide.find({
    toolName: { $regex: `^${slug}$`, $options: "i" }
  }).sort({ order: 1, createdAt: 1 }).lean();

  return NextResponse.json(
    { slides },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}

