import {useUser} from "@/hooks/useUser";
import Loading from "@/app/loading";
import CreditsUsageCard from "@/app/settings/components/CreditsUsageCard";

export function CreditsUsageTab() {
  const { user, loading } = useUser();

  if (loading) {
    return <Loading />;
  }
  if (!user) {
    return <div>Please log in to access credits usage.</div>;
  }

  return (
    <div className="space-y-8">
      <CreditsUsageCard user={user} />
    </div>
  );
}
