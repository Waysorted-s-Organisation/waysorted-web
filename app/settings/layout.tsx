import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Account Settings",
    description: "Manage your Waysorted account settings, notifications, integrations, and subscription.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        images: [
            {
                url: "/images/og-image.e13cfee0.png",
                width: 1200,
                height: 675,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
