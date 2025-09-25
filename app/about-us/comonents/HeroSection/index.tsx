"use client";

import Image from "next/image";
import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full">
      {/* Background: Top half secondary-db-100, bottom half white */}
      <div className="absolute inset-0">
        {/* Top half */}
        <div className="h-1/2 gray-bg-dots"></div>
        {/* Bottom half */}
        <div className="h-1/2 bg-white"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-12 md:pt-24">
        {/* Heading */}
        <div className="text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-4xl md:text-5xl font-semibold text-white">
            Our Team
          </h2>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-secondary-db-20 max-w-3xl font-medium mx-auto px-2 sm:px-0">
            We are a crazy symphony of professionals, orchestrating ideas to visions, and fine tuning visions to WaySorted!
          </p>
        </div>

        {/* Team Image */}
        <div className="mt-16 flex justify-center px-4 sm:px-6 md:px-8">
          <div className="relative w-full sm:max-w-3xl md:max-w-4xl lg:max-w-[959px] h-[250px] md:h-[475px] rounded-xl shadow-xl border-[12px] border-white bg-primary-way-20">
            <Image
              src="/icons/our-team.svg"
              alt="Our Team"
              fill
              className="object-cover rounded"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
