import type { Metadata } from "next";
import BlogsPageClient from "./BlogsPageClient";

const title = "Waysorted Blogs - Figma Design Workflow, Accessibility, and Product Updates";
const description =
  "Read Waysorted blogs about Figma workflows, design accessibility, color systems, productivity tools, and product updates for modern designers.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/blogs",
  },
  keywords: [
    "Waysorted blog",
    "Figma design workflow",
    "Figma plugins",
    "design accessibility",
    "color contrast",
    "design productivity",
    "UI UX design tools",
  ],
  openGraph: {
    title,
    description,
    url: "/blogs",
    siteName: "Waysorted",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Waysorted blog for designers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/og-image.png"],
  },
};

export default function BlogsPage() {
  return <BlogsPageClient />;
}
