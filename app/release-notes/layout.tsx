import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Release Notes - Waysorted Updates",
    description: "Stay up to date with the latest features, improvements, and bug fixes for the Waysorted suite. See what's new in our changelog.",
    openGraph: {
        title: "Release Notes - Waysorted Updates",
        description: "Stay up to date with the latest features, improvements, and bug fixes for the Waysorted suite.",
        url: "https://www.waysorted.com/release-notes",
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
