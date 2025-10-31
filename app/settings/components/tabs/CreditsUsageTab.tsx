import { getCurrentUser } from "@/app/settings/lib/user";
import CreditsUsageCard from "@/app/settings/components/CreditsUsageCard";
import { redirect } from "next/navigation";

export async function CreditsUsageTab() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <CreditsUsageCard user={user} />
    </div>
  );
}
