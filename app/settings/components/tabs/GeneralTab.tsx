import ProfileCard from "../ProfileCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function GeneralTab() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>Please log in to access general settings.</div>;
  }
  return <ProfileCard user={user} />;
}
