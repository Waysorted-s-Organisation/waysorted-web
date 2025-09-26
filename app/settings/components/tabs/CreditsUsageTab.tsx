import { getCurrentUser } from "@/app/settings/lib/user";
import CreditsUsageCard from "@/app/settings/components/CreditsUsageCard";

export async function CreditsUsageTab() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="space-y-8">
      <CreditsUsageCard user={user} />
    </div>
  );
}