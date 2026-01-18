import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { BannerProvider } from "@/context/BannerContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import SplashGate from "@/components/SplashGate";
import Clarity from "@/components/Clarity";

const GA_TRACKING_ID = "G-KS8MVKMRYV";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.waysorted.com"),
  alternates: {
    canonical: "/",
    languages: {
      'en': '/',
      'x-default': '/',
    },
  },
  title: {
    default: "Waysorted - Accelerate every idea with one powerful suite",
    template: "%s | Waysorted",
  },
  description:
    "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
  keywords: [
    // Brand keywords
    "Waysorted Infotech Pvt Ltd",
    "Waysorted Infotech",
    "Waysorted",
    "Waysorted plugin",
    "Waysorted Figma",
    "Waysorted beta",
    "Waysorted tools",
    "waysorted.com",
    // Product keywords
    "Figma plugin",
    "Figma plugin bundle",
    "Figma plugin marketplace",
    "PDF exporter Figma",
    "Palettable color palette",
    "unit converter plugin",
    "import tool Figma",
    "Figma PDF export plugin",
    "Figma color palette plugin",
    "px to rem converter Figma",
    // Category keywords
    "design tools",
    "design workflow",
    "designer productivity tools",
    "UI/UX tools",
    "one powerful suite",
    "unified tool suite",
    "design plugin collection",
    "best Figma plugins 2024",
    "top Figma plugins",
    // Action keywords
    "accelerate design workflow",
    "productivity for designers",
    "Figma design plugins",
    "export Figma to PDF",
    "convert px to rem Figma",
    // Speed semantic cluster (GEO)
    "fast design tools",
    "zero latency",
    "instant export",
    "real-time collaboration",
    "client-side processing",
    // Security semantic cluster (GEO)
    "secure design platform",
    "local-first architecture",
    "data privacy",
    "encrypted workflows",
    "GDPR compliant design tools",
    // Comparison keywords (GEO)
    "Figma plugin alternative",
    "all-in-one design solution",
    "replace multiple plugins",
    "replace multiple plugins",
    "Figma plugin to export PDF",
    "free Figma plugin bundle",
    // Competitor Alternatives (GEO)
    "Magicul alternative",
    "Convertify alternative",
    "Figma to PDF alternative",
  ],
  authors: [{ name: "Waysorted" }],
  creator: "Waysorted",
  publisher: "Waysorted",

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

// JSON-LD Structured Data for Google Sitelinks and GEO/AEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.waysorted.com/#organization",
      name: "Waysorted",
      legalName: "Waysorted Infotech Pvt Ltd",
      url: "https://www.waysorted.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.waysorted.com/images/logo.svg",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://twitter.com/waysorted",
        "https://www.linkedin.com/company/waysorted",
        "https://discord.gg/waysorted",
        "https://github.com/Waysorted-s-Organisation",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://www.waysorted.com/support",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "1 Eldeco Centre Malviya Nagar",
        addressLocality: "New Delhi",
        postalCode: "110017",
        addressCountry: "IN",
      },
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
      "@id": "https://www.waysorted.com/#software",
      name: "Waysorted",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web, Figma",
      description: "A unified creative workflow suite for designers to replace multiple plugins with one platform.",
      featureList: [
        "PDF Exporter - Export Figma frames to PDF with zero latency",
        "Palettable - Color palette generator with instant contrast checking",
        "Unit Converter - Real-time conversion between px, rem, em, pt",
        "Import Tool - Fast asset import into Figma",
        "Local-first architecture - Your data stays on your device",
        "Client-side processing - No server uploads required",
        "Unified plugin suite - Replace multiple tools with one",
      ],
      keywords: "Figma plugin, design tools, productivity, fast, secure, local-first, zero latency",
      softwareVersion: "1.0.0",
      releaseNotes: "https://www.waysorted.com/release-notes",
      screenshot: "https://www.waysorted.com/images/og-image.png",
      softwareHelp: {
        "@type": "CreativeWork",
        url: "https://www.waysorted.com/docs",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "100",
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@id": "https://www.waysorted.com/#organization",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.waysorted.com/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.waysorted.com",
        },
      ],
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

        <Clarity />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${hanken.className} no-scrollbar`}>
        <SplashGate minMs={4000} initialOnly>
          <BannerProvider>
            {children}
            {/* <EarlyAccessPopup /> */}
          </BannerProvider>
        </SplashGate>
        <SpeedInsights />
        <Analytics />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
