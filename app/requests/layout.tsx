import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Feature Requests & Roadmap - Waysorted",
    description:
        "Have an idea? Suggest a feature, vote on improvements, and help shape the Waysorted roadmap.",
    keywords: [
        "Waysorted feature request",
        "suggest a feature",
        "roadmap",
        "feedback",
        "waysorted ideas",
        "figma plugin",
        "design tools",
    ],
    authors: [{ name: 'Waysorted', url: 'https://www.waysorted.com' }],
    creator: 'Waysorted Infotech Pvt Ltd',
    publisher: 'Waysorted',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    alternates: {
        canonical: 'https://www.waysorted.com/requests',
    },
    openGraph: {
        title: "Feature Requests & Roadmap - Waysorted",
        description:
            "Have an idea? Suggest a feature, vote on improvements, and help shape the Waysorted roadmap.",
        url: 'https://www.waysorted.com/requests',
        siteName: 'Waysorted',
        locale: 'en_IN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: "Feature Requests & Roadmap - Waysorted",
        description: "Suggest a feature, vote on improvements, and help shape the Waysorted roadmap.",
        creator: '@Waysorted',
        site: '@Waysorted',
    },
    other: {
        'geo.region': 'IN',
        'geo.placename': 'India',
        'geo.position': '20.5937;78.9629',
        'ICBM': '20.5937, 78.9629',
    },
};


export default function RequestsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
