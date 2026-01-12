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
    const slides = [
      {
        toolName: "Frames to PDF",
        order: 1,
        toolID: "tool_frames-to-pdf",
        title: "Reorder & Merge frames",
        subtitle: "Organize Your Frames",
        bullets: [
          "Quickly reorder your selected frames with intuitive drag-and-drop functionality.",
          "Arrange frames in your desired sequence before exporting.",
          "Merge all frames into a single, perfectly sequenced PDF document."
        ],
        image: "/images/frames-to-pdf/1.png",
        imageAlt: "Frame reordering interface with drag-and-drop functionality for PDF merging"
      },
      {
        toolName: "Frames to PDF",
        order: 2,
        toolID: "tool_frames-to-pdf",
        title: "Group merge",
        subtitle: "Batch Processing Made Easy",
        bullets: [
          "Create multiple merged PDFs in a single operation using groups.",
          "Drag frames into groups and reposition them for your desired output.",
          "Process batch exports efficiently with intelligent grouping controls."
        ],
        image: "/images/frames-to-pdf/2.png",
        imageAlt: "Group merge interface showing multiple PDF creation in batch"
      },
      {
        toolName: "Frames to PDF",
        order: 3,
        toolID: "tool_frames-to-pdf",
        title: "Preview Section",
        subtitle: "Visual Verification",
        bullets: [
          "View a real-time preview of your merged PDF output.",
          "Verify frame order and content accuracy before exporting.",
          "Catch errors early with instant visual feedback."
        ],
        image: "/images/frames-to-pdf/3.png",
        imageAlt: "Preview panel displaying merged PDF output for verification"
      },
      {
        toolName: "Frames to PDF",
        order: 4,
        toolID: "tool_frames-to-pdf",
        title: "Change DPI",
        subtitle: "Resolution Control",
        bullets: [
          "Take full control of your resolution with flexible DPI settings.",
          "Choose 72 DPI for web screens, 300 DPI for professional printing, or 150 DPI for standard file sharing.",
          "Adjust DPI to ensure your final design is pixel-perfect for any output medium."
        ],
        image: "/images/frames-to-pdf/4.png",
        imageAlt: "DPI settings panel with options for 72, 150, and 300 DPI resolution"
      },
      {
        toolName: "Frames to PDF",
        order: 5,
        toolID: "tool_frames-to-pdf",
        title: "Compress PDF",
        subtitle: "Optimize File Size",
        bullets: [
          "Reduce PDF file size without sacrificing visual quality.",
          "Choose between high or low compression based on your needs.",
          "Optimize files for faster sharing via web and email."
        ],
        image: "/images/frames-to-pdf/5.png",
        imageAlt: "PDF compression settings with high and low compression options"
      },
      {
        toolName: "Frames to PDF",
        order: 6,
        toolID: "tool_frames-to-pdf",
        title: "Password Encryption",
        subtitle: "Secure Your Documents",
        bullets: [
          "Protect your confidential PDFs with password encryption.",
          "Ensure only authorized viewers can access your sensitive designs.",
          "Maintain full security control over your exported documents."
        ],
        image: "/images/frames-to-pdf/6.png",
        imageAlt: "Password encryption dialog for securing PDF documents"
      },
      {
        toolName: "Frames to PDF",
        order: 7,
        toolID: "tool_frames-to-pdf",
        title: "Color Mode",
        subtitle: "Perfect Color Profile",
        bullets: [
          "Choose the perfect color profile for your exported files.",
          "Select RGB for digital screens and online viewing.",
          "Pick CMYK for professional print media to ensure accurate color reproduction."
        ],
        image: "/images/frames-to-pdf/7.png",
        imageAlt: "Color mode selection panel with RGB and CMYK options"
      },
      {
        toolName: "Frames to PDF",
        order: 8,
        toolID: "tool_frames-to-pdf",
        title: "Export & Zip Export",
        subtitle: "Download Options",
        bullets: [
          "Export your final document with precision and speed.",
          "Instantly download your ready-to-share PDF file.",
          "Use Zip Export to bundle multiple files efficiently for organized delivery."
        ],
        image: "/images/frames-to-pdf/8.png",
        imageAlt: "Export options showing PDF download and Zip export functionality"
      }
    ];
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

