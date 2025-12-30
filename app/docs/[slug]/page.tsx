import React from "react";
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
import DataProcessing from "./content/data-processing";
import CookiePolicy from "./content/cookie-policy";
import IntellectualPropertyRights from "./content/intellectual-property-rights";
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
  "data-processing": DataProcessing,
  "cookie-policy": CookiePolicy,
  "intellectual-property-rights": IntellectualPropertyRights,
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
