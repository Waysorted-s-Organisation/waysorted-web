import { redirect } from "next/navigation";
import NotificationsCard from "../NotificationsCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function NotificationsTab() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <NotificationsCard
      user={user}
    />
  );
}