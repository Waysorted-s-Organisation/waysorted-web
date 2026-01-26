import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Help Center & FAQs",
    description: "Need help? Contact our support team, view frequently asked questions, or get in touch for assistance.",
    keywords: [
        "Waysorted support",
        "contact us",
        "help center",
        "FAQs",
        "customer service",
    ],
    openGraph: {
        title: "Help Center & FAQs",
        description: "Need help? Contact our support team, view frequently asked questions, or get in touch for assistance.",
    },
};

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
