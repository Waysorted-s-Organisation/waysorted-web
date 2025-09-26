import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { BannerProvider } from "@/context/BannerContext";
import ScrollProvider from "@/components/ScrollProvider";
import Footer from "@/components/Footer";

const hanken = Hanken_Grotesk({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "WaySorted - Unified Tools Hub for Makers",
  description:
    "10+ expert-approved Figma tools bundled by use case, optimized for performance, and designed to help you work smarter, not harder.",
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${hanken.className} no-scrollbar`}>
        <BannerProvider>
          <ScrollProvider>{children}</ScrollProvider>
        </BannerProvider>
      </body>
    </html>
  );
}
