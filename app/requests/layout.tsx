import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Feature Requests & Roadmap",
    description:
        "Have an idea? Suggest a feature, vote on improvements, and help shape the Waysorted roadmap.",
    keywords: [
        "Waysorted feature request",
        "suggest a feature",
        "roadmap",
        "feedback",
        "waysorted ideas",
    ],
    openGraph: {
        title: "Feature Requests & Roadmap",
        description:
            "Have an idea? Suggest a feature, vote on improvements, and help shape the Waysorted roadmap.",
    },
};

export default function RequestsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
