import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Feature Requests - Shape Waysorted's Future",
    description: "Have an idea for a new tool or improvement? Submit feature requests, vote on existing ideas, and help us build the future of Waysorted.",
    openGraph: {
        title: "Feature Requests - Shape Waysorted's Future",
        description: "Submit feature requests, vote on existing ideas, and help us build the future of Waysorted.",
        url: "https://www.waysorted.com/requests",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 675,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
    alternates: {
        canonical: "https://www.waysorted.com/requests",
    }
};

export default function RequestsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
