import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Try Waysorted Beta for Figma",
    description:
        "Use Waysorted inside Figma to work smarter with bundled, use-case-based plugins. Get started with the beta and accelerate your design workflow.",
    alternates: {
        canonical: "https://www.waysorted.com/figma-beta",
    },
    openGraph: {
        title: "Try Waysorted Beta for Figma | Waysorted",
        description:
            "Use Waysorted inside Figma to work smarter with bundled, use-case-based plugins.",
        url: "https://www.waysorted.com/figma-beta",
        type: "website",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 675,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
};

export default function FigmaBetaPage() {
    // Redirect to the learning/tools page or specific Figma plugin page.
    // Uses a permanent (308) redirect so search engines consolidate any link
    // equity for /figma-beta into /learning instead of treating it as temporary.
    permanentRedirect("/learning");
}
