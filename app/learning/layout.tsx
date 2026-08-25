import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Explore Beta release tools",
    description: "Discover the tools included in the current Waysorted Beta release. Built to improve speed, focus, and productivity for designers.",
    keywords: [
        "Waysorted tools",
        "Figma plugins",
        "PDF exporter",
        "Palettable",
        "unit converter",
        "import tool",
        "design tools beta",
    ],
    openGraph: {
        title: "Explore Beta release tools | Waysorted",
        description: "Discover the tools included in the current Waysorted Beta release. Built to improve speed, focus, and productivity.",
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

export default function LearningLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
