import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Try Waysorted Beta for Figma",
    description: "Use Waysorted inside Figma to work smarter with bundled, use-case-based plugins. Get early access to the beta.",
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
    },
};

export default function GetEarlyAccessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
