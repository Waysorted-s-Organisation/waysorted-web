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
  title: {
    default: "Waysorted - Accelerate every idea with one powerful suite",
    template: "%s | Waysorted",
  },
  description:
    "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
  keywords: [
    // Brand keywords
    "Waysorted",
    "Waysorted plugin",
    "Waysorted Figma",
    "Waysorted beta",
    "Waysorted tools",
    // Product keywords
    "Figma plugin",
    "Figma plugin bundle",
    "Figma plugin marketplace",
    "PDF exporter Figma",
    "Palettable color palette",
    "unit converter plugin",
    "import tool Figma",
    // Category keywords  
    "design tools",
    "design workflow",
    "designer productivity tools",
    "UI/UX tools",
    "one powerful suite",
    "unified tool suite",
    "design plugin collection",
    // Action keywords
    "accelerate design workflow",
    "productivity for designers",
    "Figma design plugins",
  ],
  authors: [{ name: "Waysorted" }],
  creator: "Waysorted",
  publisher: "Waysorted",
  metadataBase: new URL("https://www.waysorted.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.waysorted.com",
    siteName: "Waysorted",
    title: "Waysorted - Accelerate every idea with one powerful suite",
    description:
      "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Waysorted - Unified Tools Hub for Designers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waysorted - Accelerate every idea with one powerful suite",
    description:
      "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
};

// JSON-LD Structured Data for Google Sitelinks
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.waysorted.com/#organization",
      name: "Waysorted",
      url: "https://www.waysorted.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.waysorted.com/images/logo.svg",
      },
      sameAs: [
        "https://twitter.com/waysorted",
        "https://www.linkedin.com/company/waysorted",
        "https://discord.gg/waysorted",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.waysorted.com/#website",
      url: "https://www.waysorted.com",
      name: "Waysorted",
      description:
        "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
      publisher: {
        "@id": "https://www.waysorted.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.waysorted.com/docs?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Waysorted",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web, Figma",
      description: "A unified creative workflow suite for designers to replace multiple plugins with one platform.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "100",
      },
    },
    {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "SiteNavigationElement",
          position: 1,
          name: "Login or Signup",
          description: "Sign in to continue building faster with your curated Waysorted tool stack.",
          url: "https://www.waysorted.com/login",
        },
        {
          "@type": "SiteNavigationElement",
          position: 2,
          name: "Try Waysorted Beta for Figma",
          description: "Use Waysorted inside Figma to work smarter with bundled, use-case-based plugins.",
          url: "https://www.waysorted.com/figma-beta",
        },
        {
          "@type": "SiteNavigationElement",
          position: 3,
          name: "Explore Beta Release Tools",
          description: "Discover the tools included in the current Waysorted Beta release.",
          url: "https://www.waysorted.com/learning",
        },
        {
          "@type": "SiteNavigationElement",
          position: 4,
          name: "Request a Feature",
          description: "Have an idea or suggestion? Your feedback drives our roadmap.",
          url: "https://www.waysorted.com/request-a-feature",
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
