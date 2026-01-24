import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Request a feature to Waysorted",
    description:
        "Have an idea or suggestion? Suggest a feature or improvement, your feedback drives our roadmap.",
    keywords: [
        "Waysorted feature request",
        "suggest a feature",
        "roadmap",
        "feedback",
        "waysorted ideas",
    ],
    openGraph: {
        title: "Request a feature to Waysorted",
        description:
            "Have an idea or suggestion? Suggest a feature or improvement, your feedback drives our roadmap.",
    },
};

export default function RequestsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
