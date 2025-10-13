import { NextRequest } from "next/server";
import dbConnect from "@/lib/toolsdb";
import Slide from "@/models/slide";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  await dbConnect();

  const { slug } = params;

  const slides = await Slide.find({
    toolName: { $regex: `^${slug}$`, $options: "i" }
  }).sort({ order: 1, createdAt: 1 });

  return Response.json({ slides });
}