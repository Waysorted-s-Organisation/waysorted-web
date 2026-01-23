import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import GettingStarted from "./content/getting-started";
import AccountCreationAndSetup from "./content/account-creation-and-setup";
import BugReporting from "./content/bug-reporting";
import CommonErrors from "./content/common-errors";
import ContactSupport from "./content/contact-support";
import DeveloperFocusedGuide from "./content/developer-focused-guide";
import Diagnostics from "./content/diagnostics";
import EarningCredits from "./content/earning-credits";
import FAQs from "./content/faqs";
import ImportTool from "./content/import-tool";
import ManagingCredits from "./content/managing-credits";
import OverviewAndAuthentication from "./content/overview-and-authentication";
import Palettable from "./content/palettable";
import ProfileAndSettings from "./content/profile-and-settings";
import QuickIntegrationWithFigma from "./content/quick-integration-with-figma";
import RateLimits from "./content/rate-limits";
import UnitConverter from "./content/unit-converter";
import UpcomingTools from "./content/upcoming-tools";
import UsingCredits from "./content/using-credits";
import Webhooks from "./content/webhooks";
import SearchingAndBrowsingPlugins from "./content/searching-and-browsing-plugins";
import CreatorGuidelines from "./content/creator-guidelines";
import RequestAFeature from "./content/request-a-feature";
import RatingsAndReviews from "./content/ratings-and-reviews";
import PdfExporter from "./content/pdf-exporter";
import PrivacyPolicy from "./content/privacy-policy";
import TermsOfService from "./content/terms-of-service";
import FigmaSync from "./content/figma-sync";
import BackupAndRecovery from "./content/backup-and-recovery";
import ThirdPartyIntegrations from "./content/third-party-integrations";
import Overview from "./content/overview";
import Introduction from "./content/introduction";
import MainUI from "./content/main-ui";
import Wayspace from "./content/wayspace";
import Waychallenge from "./content/waychallenge";
import OtherFeatures from "./content/other-features";
import AccountAndWorkspace from "./content/account-and-workspace";
import WhatIsWaysorted from "./content/what-is-waysorted";
import AccessingWaysortedInFigma from "./content/accessing-waysorted-in-figma";
import AllInOneTools from "./content/all-in-one-tools";
import SupportedPlatforms from "./content/supported-platforms";
import CreditsAndUsage from "./content/credits-and-usage";
import WhatsComingNext from "./content/whats-coming-next";
import AccountSettingsNavigation from "./content/account-settings-navigation";
import ProfileAndSettingsOverview from "./content/profile-and-settings-overview";
import ProfilePhoto from "./content/profile-photo";
import LinkedAccountsAndIntegrations from "./content/linked-accounts-and-integrations";
import NotificationsPreferences from "./content/notifications-preferences";
import BetaFeatures from "./content/beta-features";
// New imports from dev branch
import AccessibilityWcag from "./content/accessibility-wcag";
import HandoffStandards from "./content/handoff-standards";
import UiUxBestPractices from "./content/ui-ux-best-practices";
import WaysortedPrinciples from "./content/waysorted-principles";
import Examples from "./content/examples";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONTENT_MAP: Record<string, React.ComponentType<any>> = {
  "getting-started": GettingStarted,
  "account-creation-and-setup": AccountCreationAndSetup,
  "bug-reporting": BugReporting,
  "common-errors": CommonErrors,
  "contact-support": ContactSupport,
  "developer-focused-guide": DeveloperFocusedGuide,
  "diagnostics": Diagnostics,
  "earning-credits": EarningCredits,
  "faqs": FAQs,
  "import-tool": ImportTool,
  "managing-credits": ManagingCredits,
  "overview-and-authentication": OverviewAndAuthentication,
  "palettable": Palettable,
  "profile-and-settings": ProfileAndSettings,
  "quick-integration-with-figma": QuickIntegrationWithFigma,
  "rate-limits": RateLimits,
  "unit-converter": UnitConverter,
  "upcoming-tools": UpcomingTools,
  "using-credits": UsingCredits,
  "webhooks": Webhooks,
  "searching-and-browsing-plugins": SearchingAndBrowsingPlugins,
  "creator-guidelines": CreatorGuidelines,
  "request-a-feature": RequestAFeature,
  "ratings-and-reviews": RatingsAndReviews,
  "pdf-exporter": PdfExporter,
  "privacy-policy": PrivacyPolicy,
  "terms-of-service": TermsOfService,
  "figma-sync": FigmaSync,
  "backup-and-recovery": BackupAndRecovery,
  "third-party-integrations": ThirdPartyIntegrations,
  "overview": Overview,
  "introduction": Introduction,
  "main-ui": MainUI,
  "wayspace": Wayspace,
  "waychallenge": Waychallenge,
  "other-features": OtherFeatures,
  "account-and-workspace": AccountAndWorkspace,
  "what-is-waysorted": WhatIsWaysorted,
  "accessing-waysorted-in-figma": AccessingWaysortedInFigma,
  "all-in-one-tools": AllInOneTools,
  "supported-platforms": SupportedPlatforms,
  "credits-and-usage": CreditsAndUsage,
  "whats-coming-next": WhatsComingNext,
  "account-settings-navigation": AccountSettingsNavigation,
  "profile-and-settings-overview": ProfileAndSettingsOverview,
  "profile-photo": ProfilePhoto,
  "linked-accounts-and-integrations": LinkedAccountsAndIntegrations,
  "notifications-preferences": NotificationsPreferences,
  "beta-features": BetaFeatures,
  // New mappings from dev branch
  "accessibility-wcag": AccessibilityWcag,
  "handoff-standards": HandoffStandards,
  "ui-ux-best-practices": UiUxBestPractices,
  "waysorted-principles": WaysortedPrinciples,
  "examples": Examples,
};

// pSEO: Dynamic metadata for each doc page
const META_MAP: Record<string, { title: string; description: string }> = {
  "getting-started": { title: "Getting Started with Waysorted", description: "Learn how to get started with Waysorted - the unified Figma plugin suite. Quick setup guide for designers." },
  "account-creation-and-setup": { title: "Create Your Waysorted Account", description: "Step-by-step guide to creating and setting up your Waysorted account for Figma plugin access." },
  "pdf-exporter": { title: "PDF Exporter Tool - Export Figma to PDF", description: "Export Figma frames to high-quality PDF with zero latency. Complete guide to Waysorted's PDF Exporter tool." },
  "palettable": { title: "Palettable - Color Palette Generator", description: "Generate beautiful color palettes with instant contrast checking. Waysorted's Palettable tool documentation." },
  "unit-converter": { title: "Unit Converter - px to rem, em, pt", description: "Convert between design units instantly. Real-time px, rem, em, pt conversion in Figma with Waysorted." },
  "import-tool": { title: "Import Tool - Import Assets to Figma", description: "Fast asset import into Figma with Waysorted's Import Tool. Supports images, SVGs, and more." },
  "faqs": { title: "Waysorted FAQs - Frequently Asked Questions", description: "Find answers to common questions about Waysorted Figma plugins, billing, features, and troubleshooting." },
  "what-is-waysorted": { title: "What is Waysorted?", description: "Discover Waysorted - a unified creative workflow suite replacing multiple Figma plugins with one platform." },
  "quick-integration-with-figma": { title: "Quick Figma Integration Guide", description: "Integrate Waysorted with Figma in minutes. Step-by-step installation and setup instructions." },
  "privacy-policy": { title: "Privacy Policy", description: "Waysorted's privacy policy. Learn how we protect your data with local-first architecture and encryption." },
  "terms-of-service": { title: "Terms of Service", description: "Waysorted terms of service agreement. Read our usage terms and conditions." },
  "bug-reporting": { title: "Report a Bug", description: "How to report bugs and issues with Waysorted plugins. Help us improve your design workflow." },
  "contact-support": { title: "Contact Support", description: "Get help from Waysorted support team. Contact options and response times." },
};

function formatSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = META_MAP[slug];
  const title = meta?.title || `${formatSlugToTitle(slug)} - Waysorted Docs`;
  const description = meta?.description || `Learn about ${formatSlugToTitle(slug)} in Waysorted documentation. Guides and tutorials for designers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.waysorted.com/docs/${slug}`,
      type: "article",
    },
    twitter: {
      title,
      description,
    },
    alternates: {
      canonical: `https://www.waysorted.com/docs/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(CONTENT_MAP).map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Comp = CONTENT_MAP[slug];
  if (!Comp) return notFound();

  const meta = META_MAP[slug];
  const title = meta?.title || formatSlugToTitle(slug);
  const description = meta?.description || `Learn about ${title} in Waysorted documentation.`;

  // TechArticle JSON-LD for pSEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description: description,
    url: `https://www.waysorted.com/docs/${slug}`,
    author: {
      "@type": "Organization",
      name: "Waysorted",
      url: "https://www.waysorted.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Waysorted",
      logo: {
        "@type": "ImageObject",
        url: "https://www.waysorted.com/images/logo.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.waysorted.com/docs/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Comp />
    </>
  );
}
