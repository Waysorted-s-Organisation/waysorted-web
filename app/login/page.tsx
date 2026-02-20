import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login or Signup",
  description:
    "Sign in to continue building faster with your curated Waysorted tool stack. Access your account and manage your design workflow tools.",
  alternates: {
    canonical: "https://www.waysorted.com/login",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Login or Signup | Waysorted",
    description:
      "Sign in to continue building faster with your curated Waysorted tool stack.",
    url: "https://www.waysorted.com/login",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Waysorted - Accelerate every idea with one powerful suite",
      },
    ],
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params?.redirect || "/";

  return <LoginClient redirect={redirect} />;
}