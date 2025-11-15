"use client";

import ReferAndEarnCard from "../ReferAndEarnCard";

export default function ReferAndEarnTab() {
  return (
      <ReferAndEarnCard
        creditPerReferral={200}
        maxReferrals={10}
        friendReward={50}
      />
  );
}
