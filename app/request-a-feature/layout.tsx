import type { Metadata } from "next";
import { RequestFeatureProvider } from "@/context/RequestFeatureContext";

export const metadata: Metadata = {
    title: "Request a Feature - Waysorted",
    description: "Have an idea or suggestion? Request a feature or report a bug. Your feedback drives our roadmap.",
    keywords: [
        "Waysorted feature request",
        "request a feature",
        "bug report Waysorted",
        "Waysorted feedback",
        "Figma plugin suggestions",
    ],
    openGraph: {
        title: "Request a Feature - Waysorted",
        description: "Have an idea or suggestion? Request a feature or report a bug. Your feedback drives our roadmap.",
    },
};

export default function RequestFeatureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequestFeatureProvider>
            {children}
        </RequestFeatureProvider>
    );
}
