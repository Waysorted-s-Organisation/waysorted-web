import ProfileCard from "../ProfileCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function GeneralTab() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>User not found.</div>;
  }
  return <ProfileCard user={user} />;
}