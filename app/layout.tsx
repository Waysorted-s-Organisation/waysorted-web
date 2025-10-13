import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { BannerProvider } from "@/context/BannerContext";
// import EarlyAccessPopup from "@/components/EarlyAccessPopup";
import SplashGate from "@/components/SplashGate";

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
        <SplashGate minMs={4000} initialOnly>
        <BannerProvider>
          {children}
          {/* <EarlyAccessPopup /> */}
        </BannerProvider>
        </SplashGate>
      </body>
    </html>
  );
}
