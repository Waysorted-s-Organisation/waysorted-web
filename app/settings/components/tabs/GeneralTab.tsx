import { redirect } from "next/navigation";
import ProfileCard from "../ProfileCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function GeneralTab() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return <ProfileCard user={user} />;
}