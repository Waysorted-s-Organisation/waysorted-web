import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { BannerProvider } from "@/context/BannerContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
// import EarlyAccessPopup from "@/components/EarlyAccessPopup";
import SplashGate from "@/components/SplashGate";

const GA_TRACKING_ID = "G-KS8MVKMRYV";

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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body className={`${hanken.className} no-scrollbar select-none`}>
        <SplashGate minMs={4000} initialOnly>
          <BannerProvider>
            {children}
            {/* <EarlyAccessPopup /> */}
          </BannerProvider>
        </SplashGate>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
