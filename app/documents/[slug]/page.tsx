import React from "react";
import { notFound } from "next/navigation";
import GettingStarted from "./content/getting-started";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONTENT_MAP: Record<string, React.ComponentType<any>> = {
  "getting-started": GettingStarted,
};


export async function generateStaticParams() {
  return Object.keys(CONTENT_MAP).map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Comp = CONTENT_MAP[slug];
  if (!Comp) return notFound();
  return <Comp />;
}