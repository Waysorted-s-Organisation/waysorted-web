"use client";

import Sidebar from "./components/Sidebar";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";

import { GeneralTab } from "./components/tabs/GeneralTab";
import { CreditsUsageTab } from "./components/tabs/CreditsUsageTab";
import { SubscriptionTab } from "./components/tabs/SubscriptionTab";
import { NotificationsTab } from "./components/tabs/NotificationsTab";
import { IntegrationsTab } from "./components/tabs/IntegrationsTab";
import { BetaFeaturesTab } from "./components/tabs/BetaFeaturesTab";
import ReferAndEarnTab from "./components/tabs/ReferAndEarnTab";
import TopBanner from "./components/TopBanner";
import Loading from "../loading";

type TabKey =
  | "general"
  | "refer"
  | "credits"
  | "subscription"
  | "notifications"
  | "integrations"
  | "beta";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabKey | null;

  const { user, loading } = useUser();

  if (loading) return <Loading />;
  if (!user) return <div>Please log in to access settings.</div>;

  const tab = tabParam || "general";

  function renderTab() {
    switch (tab) {
      case "general":
        return <GeneralTab />;
      case "refer":
        return <ReferAndEarnTab />;
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

  return (
    <div className="min-h-screen w-full">
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
