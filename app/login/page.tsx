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
  },
};

export default function LoginPage() {
  return <LoginClient />;
}