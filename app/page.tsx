import type { Metadata } from "next";
import Home from "@/components/Home";

export const metadata: Metadata = {
  title: "Waysorted - Accelerate every idea with one powerful suite",
  description:
    "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
  alternates: {
    canonical: "https://www.waysorted.com",
  },
  // Deliberately no openGraph block. A page's overrides REPLACE the layout's
  // rather than merging into it, so declaring one here only to repeat the share
  // image dropped og:type, og:url, og:site_name, og:locale and og:description
  // from the homepage - the tags agents use to resolve who this site belongs to.
  // The root layout already names the same image, so inheriting is both shorter
  // and complete. See app/pricing/page.tsx for the case where a page genuinely
  // needs its own block and therefore has to restate images.
};

export default function Page() {
  return (
    <>
      <Home />
    </>
  );
}
