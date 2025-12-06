import React from "react";
import { notFound } from "next/navigation";
import GettingStarted from "./content/getting-started";
import AccessibilityWcag from "./content/accessibility-wcag";
import AccountCreationAndSetup from "./content/account-creation-and-setup";
import BackupAndRecovery from "./content/backup-and-recovery";
import BugReporting from "./content/bug-reporting";
import CommonErrors from "./content/common-errors";
import ContactSupport from "./content/contact-support";
import CreatorGuidelines from "./content/creator-guidelines";
import CookiePolicy from "./content/cookie-policy";
import DataProcessing from "./content/data-processing";
import DeveloperFocusedGuide from "./content/developer-focused-guide";
import Diagnostics from "./content/diagnostics";
import EarningCredits from "./content/earning-credits";
import Examples from "./content/examples";
import FAQs from "./content/faqs";
import FigmaSync from "./content/figma-sync";
import HandoffStandards from "./content/handoff-standards";
import ImportTool from "./content/import-tool";
import IntellectualPropertyRights from "./content/intellectual-property-rights";
import ManagingCredits from "./content/managing-credits";
import OverviewAndAuthentication from "./content/overview-and-authentication";
import Overview from "./content/overview";
import Palettable from "./content/palettable";
import PrivacyPolicy from "./content/privacy-policy";
import ProfileAndSettings from "./content/profile-and-settings";
import QuickIntegrationWithFigma from "./content/quick-integration-with-figma";
import RateLimits from "./content/rate-limits";
import RequestAFeature from "./content/request-a-feature";
import SearchingAndBrowsingPlugins from "./content/searching-and-browsing-plugins";
import TermsOfService from "./content/terms-of-service";
import ThirdPartyIntegrations from "./content/third-party-integrations";
import UiUxBestPractices from "./content/ui-ux-best-practices";
import UnitConverter from "./content/unit-converter";
import UpcomingTools from "./content/upcoming-tools";
import UsingCredits from "./content/using-credits";
import WaysortedPrinciples from "./content/waysorted-principles";
import Webhooks from "./content/webhooks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONTENT_MAP: Record<string, React.ComponentType<any>> = {
  "getting-started": GettingStarted,
  "accessibility-wcag": AccessibilityWcag,
  "account-creation-and-setup": AccountCreationAndSetup,
  "backup-and-recovery": BackupAndRecovery,
  "bug-reporting": BugReporting,
  "common-errors": CommonErrors,
  "contact-support": ContactSupport,
  "creator-guidelines": CreatorGuidelines,
  "cookie-policy": CookiePolicy,
  "data-processing": DataProcessing,
  "developer-focused-guide": DeveloperFocusedGuide,
  "diagnostics": Diagnostics,
  "earning-credits": EarningCredits,
  "examples": Examples,
  "faqs": FAQs,
  "figma-sync": FigmaSync,
  "handoff-standards": HandoffStandards,
  "import-tool": ImportTool,
  "intellectual-property-rights": IntellectualPropertyRights,
  "managing-credits": ManagingCredits,
  "overview-and-authentication": OverviewAndAuthentication,
  "overview": Overview,
  "palettable": Palettable,
  "privacy-policy": PrivacyPolicy,
  "profile-and-settings": ProfileAndSettings,
  "quick-integration-with-figma": QuickIntegrationWithFigma,
  "rate-limits": RateLimits,
  "request-a-feature": RequestAFeature,
  "searching-and-browsing-plugins": SearchingAndBrowsingPlugins,
  "terms-of-service": TermsOfService,
  "third-party-integrations": ThirdPartyIntegrations,
  "ui-ux-best-practices": UiUxBestPractices,
  "unit-converter": UnitConverter,
  "upcoming-tools": UpcomingTools,
  "using-credits": UsingCredits,
  "waysorted-principles": WaysortedPrinciples,
  "webhooks": Webhooks,

};


export async function generateStaticParams() {
  return Object.keys(CONTENT_MAP).map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Comp = CONTENT_MAP[slug];
  if (!Comp) return notFound();
  return <Comp />;
}