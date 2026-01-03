import type { Metadata } from "next";
import LearnClient from "./LearnClient";

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
  },
};

export default function LearningPage() {
  return <LearnClient />;
}