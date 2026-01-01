import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login or Signup",
    description: "Sign in to continue building faster with your curated Waysorted tool stack. Access your unified design toolkit.",
    openGraph: {
        title: "Login or Signup | Waysorted",
        description: "Sign in to continue building faster with your curated Waysorted tool stack.",
    },
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
