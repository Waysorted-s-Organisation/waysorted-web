import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Create Account | Waysorted",
  description:
    "Create your Waysorted account and start building faster with your curated tool stack.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params?.redirect || "/";

  return <SignupClient redirect={redirect} />;
}