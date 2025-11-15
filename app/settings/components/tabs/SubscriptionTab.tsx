import { getCurrentUser } from "@/app/settings/lib/user";
import SubscriptionCard from "../SubscriptionCard";

export async function SubscriptionTab() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>Please log in to access subscription settings.</div>;
  }
  return (
    <SubscriptionCard
      user={user}
    />
  );
}
