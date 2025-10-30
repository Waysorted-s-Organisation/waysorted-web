import BetaFeaturesCard from "../BetaFeaturesCard";
import { getCurrentUser } from "@/app/settings/lib/user";

export async function BetaFeaturesTab() {
    const user = await getCurrentUser();
    if (!user) {
        return <div>User not found.</div>;
    }
  return (
    <BetaFeaturesCard
      user={user}
      features={[
        {
          id: "f1",
          title: "Free Access to Premium Tools",
          description:
            "Unlock premium tools at no cost—boost your productivity and explore all that Waysorted has to offer, for free.",
        },
        {
          id: "f2",
          title: "Feature Requests & Bug Reporting",
          description:
            "Help shape the platform by requesting new features and reporting bugs—your feedback drives the future of Waysorted.",
        },
        {
          id: "f3",
          title: "Exclusive Early Adopter Badge",
          description:
            "Earn a unique badge that highlights your status on the upcoming leaderboard—stand out as a key contributor to Waysorted’s success.",
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