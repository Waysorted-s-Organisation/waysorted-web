import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Request a feature to Waysorted",
    description: "Have an idea or suggestion? Suggest a feature or improvement, your feedback drives our roadmap. Contact Waysorted support.",
    keywords: [
        "Waysorted support",
        "feature request",
        "contact Waysorted",
        "Waysorted feedback",
        "design plugin support",
    ],
    openGraph: {
        title: "Request a feature to Waysorted",
        description: "Have an idea or suggestion? Suggest a feature or improvement, your feedback drives our roadmap.",
    },
};

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
