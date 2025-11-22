import BetaFeaturesCard from "../BetaFeaturesCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function BetaFeaturesTab() {
    const user = await getCurrentUser();
    if (!user) {
        return <div>Please log in to access beta features.</div>;
    }
  return (
    <BetaFeaturesCard
      user={user}
      features={[
        {
          id: "f1",
          title: "Free Access to Premium Tools",
          description:
            "Unlock premium tools at no cost, boost your productivity and explore all that Waysorted has to offer, for free.",
        },
        {
          id: "f2",
          title: "500+ Free Credits",
          description:
            "Start strong with free credits to explore, test, and create without limits. Refer friends & earn even more credits!",
        },
        {
          id: "f3",
          title: "Exclusive Early Adopter Badge",
          description:
            "Get recognized as a founding creator, your badge will shine on the leaderboard and mark you as one of the first to join the journey.",
        },
        {
          id: "f4",
          title: "Community Access",
          description:
            "Join an exclusive space where fellow designers connect, share insights, and get direct access to the latest updates.",
        },
      ]}
    />
  );
}
