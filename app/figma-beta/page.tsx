import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    },
};

export default function FigmaBetaPage() {
    // Redirect to the learning/tools page or specific Figma plugin page
    redirect("/learning");
}
