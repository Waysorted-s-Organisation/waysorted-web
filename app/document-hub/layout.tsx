import DocsShell from "./DocsShell.client";

export const metadata = {
  title: "Document Hub",
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

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  // DocsShell is a client component that contains header + sidebar.
  // children will be whatever the specific static page renders.
  return <DocsShell>
    <div className="bg-white">{children}</div>
  </DocsShell>
}
