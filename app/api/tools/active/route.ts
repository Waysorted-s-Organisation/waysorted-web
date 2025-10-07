import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // adjust if your path differs
import Tool from "@/models/tool"; // adjust if your path differs

export const runtime = "nodejs"; // ensure Node runtime; mongoose isn't supported on the edge

export async function GET() {
  try {
    await dbConnect();

    // Prefer your typed static; fall back to a direct query if not present
    const docs =
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (Tool as any).findActive === "function"
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? await (Tool as any).findActive()
        : await Tool.find({ isActive: true, disabled: false }).sort({ name: 1 });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = docs.map((d: any) => d.toPublic?.() ?? d);
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("GET /api/tools/active error:", err);
    return NextResponse.json({ error: "Failed to load tools" }, { status: 500 });
  }
}