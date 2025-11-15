import NotificationsCard from "../NotificationsCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function NotificationsTab() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>Please log in to access notifications.</div>;
  }
  return (
    <NotificationsCard
      user={user}
    />
  );
}
