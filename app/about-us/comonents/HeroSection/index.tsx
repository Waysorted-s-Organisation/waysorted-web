"use client";

import Image from "next/image";
import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full">
      {/* Content */}
      <div className="z-10 py-12 md:py-24 gray-bg-dots text-center">
        <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-6">
                <Image
                  src="/icons/team.svg"
                  alt="Our Team"
                  width={30}
                  height={30}
                  className="block p-1"
                />
                <span className="pl-1 pr-2 py-1 text-secondary-db-100">Way Team</span>
              </span>
        
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Meet the <span className="bg-[#FF629B]/25 rounded-xl text-[#FF6CA1] px-2">
                  Minds
                </span> Behind the Magic
              </h2>
              <p className="text-secondary-db-30 max-w-xl mx-auto mb-16 text-lg">
                A small team with a big mission — turning chaotic workflows into seamless creativity.
              </p>
      </div>
    </section>
  );
};

export default HeroSection;
