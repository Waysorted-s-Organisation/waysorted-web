import type { Metadata } from "next";
import LearnClient from "./LearnClient";
import dbConnect from "@/lib/toolsdb";
import Tool, { ITool } from "@/models/tool";
import { applyToolIconOverrides } from "@/lib/tool-icon-overrides";

export const metadata: Metadata = {
  title: "Explore Beta Release Tools",
  description:
    "Discover the tools included in the current Waysorted Beta release. Built to improve speed, focus, and productivity for designers.",
  alternates: {
    canonical: "https://www.waysorted.com/learning",
  },
  openGraph: {
    title: "Explore Beta Release Tools | Waysorted",
    description:
      "Discover the tools included in the current Waysorted Beta release. Built to improve speed, focus, and productivity.",
    url: "https://www.waysorted.com/learning",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Waysorted - Accelerate every idea with one powerful suite",
      },
    ],
  },
  keywords: [
    "Figma plugin marketplace",
    "Figma plugin bundle",
    "Waysorted beta",
    "design tools collection",
    "best Figma plugins 2024",
    "Figma plugin alternative"
  ],
};

// Badge type priority order
const badgePriority: Record<string, number> = {
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

async function getTools() {
  try {
    await dbConnect();
    // Select only needed fields for the grid to optimize performance (exclude iconData and slides)
    // isActive only - a retired tool should not be listed, but a `disabled` one
    // still is, because that is what the "Unlock's soon" badge is for.
    const all = await Tool.find({ isActive: true })
      .select('name slug heading description shortDescription icon isAI badge disabled isActive category tagline tags version')
      .lean() as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Sort by badge priority, then by name as tiebreaker
    all.sort((a, b) => {
      const pa = getBadgePriority(a as ITool);
      const pb = getBadgePriority(b as ITool);
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });

    // Serialize for props
    return JSON.parse(JSON.stringify(applyToolIconOverrides(all)));
  } catch (error) {
    console.error("Failed to fetch tools for SSR:", error);
    return [];
  }
}

export default async function LearningPage() {
  const tools = await getTools();
  return <LearnClient initialTools={tools} />;
}
