import DocsShell from "./DocsShell.client";

export const metadata = {
  title: "Documents",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  // DocsShell is a client component that contains header + sidebar.
  // children will be whatever the specific static page renders.
  return <DocsShell>
    <div className="bg-white">{children}</div>
  </DocsShell>
}
