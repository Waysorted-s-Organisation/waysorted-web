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
    openGraph: {
        title: "Sign Up for Waysorted",
        description: "Create your Waysorted account and start using the unified tool suite for designers.",
    },
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
