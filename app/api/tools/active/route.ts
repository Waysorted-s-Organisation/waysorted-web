import { NextResponse } from "next/server";
import dbConnect from "@/lib/toolsdb";
import Tool from "@/models/tool";
import { ITool } from "@/models/tool";
import { applyToolIconOverrides } from "@/lib/tool-icon-overrides";

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
  /*
   * Honour isActive - the route is called /active and used not to filter at all,
   * which is how retired tools kept surfacing on the homepage.
   *
   * Deliberately NOT filtering on `disabled`. A disabled tool is one that ships
   * with an "Unlock's soon" badge and is meant to be seen; an inactive one has
   * been retired. Filtering on both would also hide Comment Summariser.
   */
  const all = await Tool.find({ isActive: true }).lean();

  // Sort by badge priority, then by name as tiebreaker
  all.sort((a, b) => {
    const pa = getBadgePriority(a);
    const pb = getBadgePriority(b);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ data: applyToolIconOverrides(all) }, { status: 200 });
}
