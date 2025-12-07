"use client";

import ReferAndEarnCard from "../ReferAndEarnCard";
import type { IUser } from "@/models/user";

// Replace this with your actual user source/hook.
const mockUser: IUser = {
  // Include the fields your app expects. Only the ones used here are needed.
  // earlyAccess and creditsRemaining are not required for this card but kept to match your User type.
  earlyAccess: true,
  creditsRemaining: 42,
  // If your real user object provides a referralCode/inviteCode/id, the component will use it.
  referralCode: "sushant-123",
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export default function ReferAndEarnTab() {
  return (
      <ReferAndEarnCard
        user={mockUser}
        creditPerReferral={200}
        maxReferrals={10}
        friendReward={50}
      />
  );
}
