import NotificationsCard from "../NotificationsCard";
import {useUser} from "@/hooks/useUser";
import Loading from "@/app/loading";

export function NotificationsTab() {
  const { user, loading } = useUser();

  if (loading) {
    return <Loading />;
  }
  if (!user) {
    return <div>Please log in to access notifications.</div>;
  }
  return (
    <NotificationsCard
      user={user}
    />
  );
}
