import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Waysorted Infotech Pvt Ltd - Our Vision & Team",
    description: "Learn more about Waysorted Infotech Pvt Ltd. We're building the unified tool suite to accelerate every designer's workflow.",
    keywords: [
        "Waysorted Infotech Pvt Ltd",
        "Waysorted team",
        "about Waysorted",
        "design plugin creators",
        "Waysorted founders",
    ],
    openGraph: {
        title: "About Us - Meet the Waysorted Team",
        description: "Meet the team behind Waysorted. We're building the unified tool suite to accelerate every designer's workflow.",
    },
};

export default function AboutUsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
