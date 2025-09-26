import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { BannerProvider } from "@/context/BannerContext";
import EarlyAccessPopup from "@/components/EarlyAccessPopup";

const hanken = Hanken_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WaySorted - Unified Tools Hub for Makers",
  description:
    "10+ expert-approved Figma tools bundled by use case, optimized for performance, and designed to help you work smarter, not harder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${hanken.className} no-scrollbar`}>
        <BannerProvider>
          {children}
          <EarlyAccessPopup />
        </BannerProvider>
      </body>
    </html>
  );
}
