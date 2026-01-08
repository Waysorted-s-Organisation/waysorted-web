import type { Metadata } from "next";
import Home from "@/components/Home";

export const metadata: Metadata = {
  title: "Waysorted - Accelerate every idea | Waysorted Infotech Pvt Ltd",
  description:
    "Official website of Waysorted Infotech Pvt Ltd. Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow.",
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
