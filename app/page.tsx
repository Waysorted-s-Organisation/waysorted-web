import type { Metadata } from "next";
import Home from "@/components/Home";

export const metadata: Metadata = {
  title: "Waysorted - Accelerate every idea with one powerful suite",
  description:
    "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
  alternates: {
    canonical: "https://www.waysorted.com",
  },
  openGraph: {
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 675,
        alt: "Waysorted - Accelerate every idea with one powerful suite",
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <Home />
    </>
  );
}
