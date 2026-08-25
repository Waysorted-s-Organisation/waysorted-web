import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Release Notes - Waysorted Updates",
    description: "Stay up to date with the latest features, improvements, and bug fixes for the Waysorted suite. See what's new in our changelog.",
    openGraph: {
        title: "Release Notes - Waysorted Updates",
        description: "Stay up to date with the latest features, improvements, and bug fixes for the Waysorted suite.",
        url: "https://www.waysorted.com/release-notes",
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
        canonical: "https://www.waysorted.com/release-notes",
    }
};

export default function ReleaseNotesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
