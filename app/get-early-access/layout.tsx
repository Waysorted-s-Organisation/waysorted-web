import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Try Waysorted Beta for Figma",
    description: "Use Waysorted inside Figma to work smarter with bundled, use-case-based plugins. Get early access to the beta.",
    alternates: {
        canonical: "https://www.waysorted.com/get-early-access",
    },
    keywords: [
        "Waysorted beta",
        "Figma plugin beta",
        "early access Waysorted",
        "try Waysorted",
        "Figma design tools",
    ],
    openGraph: {
        title: "Try Waysorted Beta for Figma",
        description: "Use Waysorted inside Figma to work smarter with bundled, use-case-based plugins.",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 630,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
};

export default function GetEarlyAccessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
