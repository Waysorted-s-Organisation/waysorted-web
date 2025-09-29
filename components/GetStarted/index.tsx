import React from "react";
import GlowingStarButton from "@/components/GlowStarButton";

const JoinCommunity = () => {
  return (
    <section className="bg-white flex flex-col items-center justify-center py-40 px-4">
      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-semibold text-secondary-db-100 text-center">
        One tool. Infinite possibilities.
      </h1>

      {/* Subheading */}
      <p className="mt-4 text-secondary-db-80 font-medium text-xl text-center max-w-6xl">
        Waysorted transforms your <span className="text-primary-way-100">workflow, Instantly.</span>
      </p>

      {/* Button */}
      <GlowingStarButton
        className="mt-12 rounded-4xl text-white font-medium text-7xl 
                   bg-secondary-db-100 join-shadow cursor-pointer"
      >
        Get Started!
      </GlowingStarButton>
    </section>
  );
};

export default JoinCommunity;
