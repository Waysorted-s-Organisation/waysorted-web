import { NextResponse } from "next/server";
import dbConnect from "@/lib/toolsdb";
import Tool from "@/models/tool";
import { ITool } from "@/models/tool";

export const runtime = "nodejs";

// Badge type priority order
const badgePriority = {
  "new": 0,
  "up next": 1,
  "unlock soon": 2
};

function getBadgePriority(tool: ITool) {
  if (tool.badge && badgePriority.hasOwnProperty(tool.badge.type)) {
    return badgePriority[tool.badge.type];
  }
  // Tools without these badges come last
  return 999;
}

export async function GET() {
  await dbConnect();
  const all = await Tool.find();

  // Sort by badge priority, then by name as tiebreaker
  all.sort((a, b) => {
    const pa = getBadgePriority(a);
    const pb = getBadgePriority(b);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ data: all }, { status: 200 });
}