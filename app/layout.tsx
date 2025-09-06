"use client";

import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { BannerProvider, useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const hanken = Hanken_Grotesk({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "WaySorted - Unified Tools Hub for Makers",
  description:
    "10+ expert-approved Figma tools bundled by use case, optimized for performance, and designed to help you work smarter, not harder.",
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { showBanner, setShowBanner } = useBanner();

  return (
    <>
      <Header showBanner={showBanner} setShowBanner={setShowBanner} />

      <main
        className={`min-h-screen bg-gray-50 transition-all duration-300 ${
          showBanner ? "pt-24" : "pt-16"
        }`}
      >
        {children}
      </main>

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
      <body className={hanken.className}>
        <BannerProvider>
          <LayoutContent>{children}</LayoutContent>
        </BannerProvider>
      </body>
    </html>
  );
}
