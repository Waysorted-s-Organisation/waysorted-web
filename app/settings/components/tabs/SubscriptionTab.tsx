import { getCurrentUser } from "@/app/settings/lib/user";
import SubscriptionCard from "../SubscriptionCard";
import { redirect } from "next/navigation";

export async function SubscriptionTab() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <SubscriptionCard
      user={user}
    />
  );
}