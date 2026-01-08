import type { Metadata } from "next";
import Home from "@/components/Home";

export const metadata: Metadata = {
  title: "Waysorted - Accelerate every idea with one powerful suite",
  description:
    "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
  alternates: {
    canonical: "https://www.waysorted.com",
  },
};

export default function Page() {
  return (
    <>
      <Home />
    </>
  );
}
