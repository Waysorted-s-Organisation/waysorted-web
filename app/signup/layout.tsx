import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up for Waysorted",
    description: "Create your Waysorted account and start using the unified tool suite for designers. Free to get started.",
    keywords: [
        "Waysorted signup",
        "create account Waysorted",
        "free design tools",
        "Figma plugin signup",
    ],
    robots: {
        index: false,
        follow: true,
    },
    openGraph: {
        title: "Sign Up for Waysorted",
        description: "Create your Waysorted account and start using the unified tool suite for designers.",
        images: [
            {
                url: "/images/og-image.8f249510.png",
                width: 1200,
                height: 675,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
