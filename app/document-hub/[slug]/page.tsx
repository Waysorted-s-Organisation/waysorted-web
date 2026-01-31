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
import ImportTool from "./content/file-importer";
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
import PdfExporter from "./content/frames-to-pdf";
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
  "file-importer": ImportTool,
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
  "frames-to-pdf": PdfExporter,
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
  "waysorted-principles": WaysortedPrinciples,
  "examples": Examples,
};

// pSEO: Dynamic metadata for each doc page
const META_MAP: Record<string, { title: string; description: string }> = {
  // General / Getting Started
  "getting-started": { title: "Getting Started with Waysorted", description: "Learn how to get started with Waysorted - the unified Figma plugin suite. Quick setup guide for designers." },
  "what-is-waysorted": { title: "What is Waysorted?", description: "Discover Waysorted - a unified creative workflow suite replacing multiple Figma plugins with one platform." },
  "account-creation-and-setup": { title: "Create Your Account Coverage", description: "Step-by-step guide to creating and setting up your Waysorted account for full Figma plugin access." },
  "quick-integration-with-figma": { title: "Quick Figma Integration Guide", description: "Integrate Waysorted with Figma in minutes. Step-by-step installation and setup instructions." },
  "accessing-waysorted-in-figma": { title: "Accessing Waysorted in Figma", description: "How to open and launch Waysorted tools directly within your Figma canvas." },
  "faqs": { title: "Waysorted FAQs", description: "Find answers to common questions about Waysorted Figma plugins, billing, features, and troubleshooting." },

  // Plugin Suite
  "introduction": { title: "Introduction to the Suite", description: "An overview of the Waysorted plugin ecosystem and how the tools work together." },
  "main-ui": { title: "Navigating the Main UI", description: "Guide to the Waysorted interface. How to switch tools, access settings, and manage your workflow." },
  "wayspace": { title: "Wayspace - Your Creative Workspace", description: "Learn about Wayspace, the central hub for your Waysorted assets and configurations." },
  "waychallenge": { title: "Waychallenge - Daily Design Challenges", description: "Participate in Waychallenge to sharpen your design skills directly within Figma." },
  "other-features": { title: "Other Features & Utilities", description: "Explore additional utility features included in the Waysorted suite to boost productivity." },

  // Plugins and Marketplace
  "searching-and-browsing-plugins": { title: "Search and Browse Plugins", description: "How to find and activate new tools within the Waysorted marketplace." },
  "creator-guidelines": { title: "Creator Guidelines", description: "Guidelines for developers and creators building tools for the Waysorted ecosystem." },
  "ratings-and-reviews": { title: "Ratings and Reviews", description: "How to rate plugins and read reviews from other designers in the community." },

  // Account and Workspace
  "account-and-workspace": { title: "Account & Workspace Management", description: "Managing your personal account and team workspace settings in Waysorted." },
  "profile-and-settings": { title: "Profile and Settings", description: "Configure your user profile, preferences, and workspace options." },
  "account-settings-navigation": { title: "Navigating Account Settings", description: "A tour of the account settings menu and where to find key configurations." },
  "profile-and-settings-overview": { title: "Profile Settings Overview", description: "Detailed breakdown of all available profile customization options." },
  "profile-photo": { title: "Managing Your Profile Photo", description: "How to upload, change, or remove your profile picture in Waysorted." },
  "linked-accounts-and-integrations": { title: "Linked Accounts", description: "Manage third-party integrations and linked accounts connected to Waysorted." },
  "notifications-preferences": { title: "Notification Preferences", description: "Customize your email and in-app notification settings." },
  "beta-features": { title: "Beta Features Access", description: "How to enable and test experimental features in the Waysorted beta program." },

  // Tools Reference
  "frames-to-pdf": { title: "Frames to PDF Tool", description: "Export formatted Figma frames to PDF instantly. Merge, reorder, and compress PDFs." },
  "palettable": { title: "Palettable Color Tool", description: "Generate accessible color palettes and check contrast ratios directly in Figma." },
  "unit-converter": { title: "Unit Converter Tool", description: "Convert pixels to rem, em, or pt instantly within your design workflow." },
  "file-importer": { title: "File Importer Tool", description: "Import various file formats into Figma with smart processing and organization." },
  "upcoming-tools": { title: "Upcoming Tools Roadmap", description: "See what new tools and features are coming soon to the Waysorted suite." },

  // Troubleshooting & Support
  "common-errors": { title: "Common Errors & Fixes", description: "Troubleshooting guide for common issues encountered when using Waysorted plugins." },
  "diagnostics": { title: "Running Diagnostics", description: "How to run diagnostic tests to help support debug issues with your installation." },
  "contact-support": { title: "Contact Support", description: "Get help from the Waysorted team. Support channels and response times." },
  "bug-reporting": { title: "Report a Bug", description: "Submit bug reports to help us improve the stability of Waysorted tools." },
  "request-a-feature": { title: "Request a Feature", description: "Have an idea? Submit feature suggestions for the Waysorted roadmap." },

  // Legal
  "privacy-policy": { title: "Privacy Policy", description: "Waysorted's privacy policy. Data protection, encryption, and user rights." },
  "terms-of-service": { title: "Terms of Service", description: "Terms and conditions for using the Waysorted platform and plugins." },

  // Integrations
  "figma-sync": { title: "Figma Sync Integration", description: "How Waysorted syncs data seamlessly with your Figma files and teams." },
  "backup-and-recovery": { title: "Backup & Recovery", description: "Understanding how your data is backed up and how to recover it if needed." },
  "third-party-integrations": { title: "Third-Party Integrations", description: "Connecting Waysorted with other tools in your design stack." },

  // Credits
  "overview": { title: "Credits System Overview", description: "Understanding the Waysorted credits system for usage-based tools." },
  "earning-credits": { title: "Earning Credits", description: "How to earn free credits through referrals, challenges, and usage." },
  "using-credits": { title: "Using Credits", description: "Where and how to spend your credits on premium tool features." },
  "managing-credits": { title: "Managing Your Balance", description: "Check your credit balance and view transaction history." },
  "credits-and-usage": { title: "Credits & Usage Guide", description: "Comprehensive guide to credit consumption rates for different tools." },

  // API & Developer
  "developer-focused-guide": { title: "Developer Guide", description: "Technical documentation for developers building on the Waysorted platform." },
  "overview-and-authentication": { title: "API Authentication", description: "How to authenticate requests to the Waysorted API securely." },
  "rate-limits": { title: "API Rate Limits", description: "Understanding API rate limits and quotas for developer accounts." },
  "webhooks": { title: "Webhooks Reference", description: "Listen to real-time events from Waysorted using webhooks." },

  // New Resources
  "all-in-one-tools": { title: "All-in-One Tools Concept", description: "Why we bundled multiple tools into one suite and the benefits for designers." },
  "supported-platforms": { title: "Supported Platforms", description: "List of supported operating systems and Figma versions for Waysorted." },
  "whats-coming-next": { title: "What's Coming Next", description: "Sneak peek at the future roadmap and vision for Waysorted." },
  "accessibility-wcag": { title: "Accessibility & WCAG", description: "How Waysorted helps you design for accessibility and WCAG compliance." },
  "handoff-standards": { title: "Design Handoff Standards", description: "Best practices for preparing your designs for developer handoff." },
  "waysorted-principles": { title: "Our Design Principles", description: "The core philosophies that drive the design and development of Waysorted." },
  "examples": { title: "Usage Examples", description: "Real-world examples and case studies of Waysorted in action." },
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
      url: `https://www.waysorted.com/document-hub/${slug}`,
      type: "article",
    },
    twitter: {
      title,
      description,
    },
    alternates: {
      canonical: `https://www.waysorted.com/document-hub/${slug}`,
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
    url: `https://www.waysorted.com/document-hub/${slug}`,
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
      "@id": `https://www.waysorted.com/document-hub/${slug}`,
    },
  };

  // FAQPage JSON-LD for Answer Engine Optimization (AEO)
  const faqJsonLd = slug === 'faqs' ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Waysorted?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Waysorted unifies essential design tools into one place, so you spend less time switching between plugins and tabs. It helps teams work faster, stay focused, and avoid unnecessary costs."
        }
      },
      {
        "@type": "Question",
        "name": "Is Waysorted secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, with secure integrations, data processing under Privacy Policy, and no third-party sharing without consent. It uses a local-first architecture where possible."
        }
      },
      {
        "@type": "Question",
        "name": "How does Waysorted integrate with Figma?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Waysorted brings essential tools together in one unified suite within Figma. This reduces compatibility issues, performance strain, and the cost of managing multiple subscriptions."
        }
      }
    ]
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Comp />
    </>
  );
}
