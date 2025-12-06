import ProfileCard from "../ProfileCard";
import {useUser} from "@/hooks/useUser";
import Loading from "@/app/loading";

export function GeneralTab() {
  const { user, loading } = useUser();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <div>Please log in to access general settings.</div>;
  }
  return <ProfileCard user={user} />;
}
