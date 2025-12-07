import {useUser} from "@/hooks/useUser";
import Loading from "@/app/loading";
import SubscriptionCard from "../SubscriptionCard";

export function SubscriptionTab() {
  const { user, loading } = useUser();
  if (loading) {
    return <Loading />;
  }
  return (
    <SubscriptionCard
      user={user!}
    />
  );
}
