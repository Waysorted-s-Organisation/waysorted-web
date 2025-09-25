import { notFound } from "next/navigation";

import GettingStarted from "./content/getting-started";
import Faq from "./content/faq";
import PrivacyPolicy from "./content/privacy-policy";
import TermsOfService from "./content/terms-of-service";
import Overview from "./content/overview";
import SearchGuide from "./content/search-guide";
import InstallationGuide from "./content/installation-guide";
import IntegrationGuide from "./content/integration-guide";
import WorkspaceOverview from "./content/workspace-overview";
import DashboardFeatures from "./content/dashboard-features";
import CloudSyncOverview from "./content/cloud-sync-overview";
import StorageManagement from "./content/storage-management";
import BillingOverview from "./content/billing-overview";
import PaymentMethods from "./content/payment-methods";
import AccountOverview from "./content/account-overview";
import SecuritySettings from "./content/security-settings";
import ApiOverview from "./content/api-overview";
import Authentication from "./content/authentication";
import RateLimiting from "./content/rate-limiting";
import BrandGuidelines from "./content/brand-guidelines";
import UiComponents from "./content/ui-components";
import VersioningOverview from "./content/versioning-overview";
import Changelog from "./content/changelog";

const CONTENT_MAP: Record<string, React.ComponentType<any>> = {
  "getting-started": GettingStarted,
  faq: Faq,
  "privacy-policy": PrivacyPolicy,
  "terms-of-service": TermsOfService,
  overview: Overview,
  "search-guide": SearchGuide,
  "installation-guide": InstallationGuide,
  "integration-guide": IntegrationGuide,
  "workspace-overview": WorkspaceOverview,
  "dashboard-features": DashboardFeatures,
  "cloud-sync-overview": CloudSyncOverview,
  "storage-management": StorageManagement,
  "billing-overview": BillingOverview,
  "payment-methods": PaymentMethods,
  "account-overview": AccountOverview,
  "security-settings": SecuritySettings,
  "api-overview": ApiOverview,
  authentication: Authentication,
  "rate-limiting": RateLimiting,
  "brand-guidelines": BrandGuidelines,
  "ui-components": UiComponents,
  "versioning-overview": VersioningOverview,
  changelog: Changelog,
};

export async function generateStaticParams() {
  return Object.keys(CONTENT_MAP).map((slug) => ({ slug }));
}

export default async function DocPage({
  params,
}: {
  params: { slug: string };
}) {
  // await params (required by Next.js dynamic APIs)
  const { slug } = await params;

  const Comp = CONTENT_MAP[slug];
  if (!Comp) return notFound();

  // render the component (do NOT pass module objects as props)
  return <Comp />;
}
