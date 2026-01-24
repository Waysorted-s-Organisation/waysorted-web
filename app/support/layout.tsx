import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Waysorted Support - Contact Us & FAQs",
    description: "Need help? Contact Waysorted support, view FAQs, or get in touch with our team.",
    keywords: [
        "Waysorted support",
        "contact us",
        "help center",
        "FAQs",
        "customer service",
    ],
    openGraph: {
        title: "Waysorted Support - Contact Us & FAQs",
        description: "Need help? Contact Waysorted support, view FAQs, or get in touch with our team.",
    },
};

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
