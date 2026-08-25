import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "About Waysorted - Our Mission & Team",
    description: "Learn about Waysorted's mission to unify design tools. Meet the team building the future of efficient creative workflows.",
    openGraph: {
        title: "About Waysorted - Our Mission & Team",
        description: "Meet the team building the future of efficient creative workflows.",
        url: "https://www.waysorted.com/about-us",
        images: [
            {
                url: "/images/og-image.8f249510.png",
                width: 1200,
                height: 675,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
    alternates: {
        canonical: "https://www.waysorted.com/about-us",
    }
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
