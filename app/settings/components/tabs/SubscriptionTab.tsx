import { getCurrentUser } from "@/app/settings/lib/user";
import SubscriptionCard from "../SubscriptionCard";

export async function SubscriptionTab() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>User not found.</div>;
  }
  return (
    <SubscriptionCard
      user={user}
    />
  );
}