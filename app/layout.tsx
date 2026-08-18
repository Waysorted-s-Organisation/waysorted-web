import "./globals.css";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Clarity from "@/components/Clarity";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const GA_TRACKING_ID = "G-KS8MVKMRYV";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.waysorted.com"),
  // NOTE: Do not set `alternates.canonical` here. Metadata in the App Router is
  // inherited by every child segment that does not override it, so a canonical
  // on the root layout makes every page declare itself a duplicate of the
  // homepage. Each route must declare its own canonical instead.
  title: {
    default: "Waysorted - Accelerate every idea with one powerful suite",
    template: "%s | Waysorted",
  },
  description:
    "Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.",
  // `keywords` intentionally removed. Google has ignored the meta keywords tag
  // since 2009 and it is not a ranking signal on any major engine, so the 52
  // entries here bought nothing. The list also carried competitor brand names
  // ("Magicul alternative", "Convertify alternative") and filler like
  // "zero latency", which is the only part that carried any downside.
  // Rankings come from the page's actual content, not from a keyword list.
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
      // All URLs verified reachable. Broken `sameAs` entries stop Google from
      // consolidating these profiles onto the Waysorted entity:
      // - linkedin.com/company/waysorted returned 404 (the handle is waysortedhq)
      // - discord.gg/waysorted was an invalid invite ("Unknown Invite")
      sameAs: [
        "https://x.com/Waysorted",
        "https://www.linkedin.com/company/waysortedhq",
        "https://www.instagram.com/waysorted/",
        "https://discord.com/invite/U2XF76WxNv",
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
      // NOTE: `potentialAction`/SearchAction intentionally omitted. It pointed at
      // /docs, which 404s, and the site exposes no `?q=` search endpoint to back
      // it. Re-add only when a real search URL exists.
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
        url: "https://www.waysorted.com/document-hub/what-is-waysorted",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      // NOTE: `aggregateRating` intentionally omitted. Google's review-snippet
      // policy disallows self-serving ratings that are not backed by reviews
      // visible on the page. Re-add only alongside real, on-page reviews.
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

        {/* GEO Optimization Meta Tags */}
        <meta name="geo.region" content="IN-DL" />
        <meta name="geo.placename" content="New Delhi" />
        <meta name="geo.position" content="28.5355;77.2090" />
        <meta name="ICBM" content="28.5355, 77.2090" />

        <Clarity />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${hanken.className} no-scrollbar`} suppressHydrationWarning>
        <Providers>
          {/* Global session loader intentionally disabled. */}
          {children}
          {/* <EarlyAccessPopup /> */}
        </Providers>
        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics trackingId={GA_TRACKING_ID} />
      </body>
    </html>
  );
}
