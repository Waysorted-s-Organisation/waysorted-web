import BetaFeaturesCard from "../BetaFeaturesCard";
import {useUser} from "@/hooks/useUser";
import Loading from "../../loading";

export function BetaFeaturesTab() {
  const { user, loading } = useUser();

  if (loading) {
    return <Loading />;
  }
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
            "Unlock all premium tools at no cost during beta. Boost your productivity and explore everything Waysorted has to offer, completely free.",
        },
        {
          id: "f2",
          title: "Unlimited Credits for Beta Users",
          description:
            "Enjoy unlimited credits throughout the Beta Program. Experiment, test, and work without limits. ",
        },
        {
          id: "f3",
          title: "Exclusive Early Adopter Badge",
          description:
            "Stand out as a founding creator. Your badge highlights you on the leaderboard and marks your place as one of the very first Beta members.",
        },
        {
          id: "f4",
          title: "Community Access",
          description:
            "Join a exclusive space for designers. Share insights, connect with others, get support, and receive early updates straight from the Waysorted team.",
        },
      ]}
    />
  );
}
