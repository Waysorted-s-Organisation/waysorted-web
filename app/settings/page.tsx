import Sidebar from "./components/Sidebar";
import { getCurrentUser } from "./lib/user";
import { GeneralTab } from "./components/tabs/GeneralTab";
import { CreditsUsageTab } from "./components/tabs/CreditsUsageTab";
import { SubscriptionTab } from "./components/tabs/SubscriptionTab";
import { NotificationsTab } from "./components/tabs/NotificationsTab";
import { IntegrationsTab } from "./components/tabs/IntegrationsTab";
import { BetaFeaturesTab } from "./components/tabs/BetaFeaturesTab";
import TopBanner from "./components/TopBanner";

type TabKey =
  | "general"
  | "credits"
  | "subscription"
  | "notifications"
  | "integrations"
  | "beta";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const tab = (params?.tab as TabKey) || "general";

  function renderTab() {
    switch (tab) {
      case "general":
        return <GeneralTab />;
      case "credits":
        return <CreditsUsageTab />;
      case "subscription":
        return <SubscriptionTab />;
      case "notifications":
        return <NotificationsTab />;
      case "integrations":
        return <IntegrationsTab />;
      case "beta":
        return <BetaFeaturesTab />;
      default:
        return <GeneralTab />;
    }
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="min-h-screen w-full">
      {/* Example: If you still have a TopBanner, import & render it here */}
      <TopBanner earlyAccess={user.earlyAccess} />

      <div className="mx-auto flex flex-col lg:flex-row max-w-full gap-0">
        <Sidebar />
        <main className="flex-1 px-2 pt-4 pb-8 sm:px-4 sm:pt-6 sm:pb-10">
          <div className="mx-auto w-full max-w-screen-md sm:max-w-screen-lg lg:max-w-screen-2xl px-0 sm:px-4 lg:px-20 lg:py-20">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}