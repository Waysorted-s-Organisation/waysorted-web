"use client";

import Image from "next/image";
import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full">
      {/* Background: Top half primary-dark, bottom half white */}
      <div className="absolute inset-0">
        {/* Top half */}
        <div className="h-1/2 bg-primary-dark"></div>
        {/* Bottom half */}
        <div className="h-1/2 bg-white"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-12 md:py-20">
        {/* Heading */}
        <div className="text-center px-4">
          <h2 className="text-4xl md:text-5xl font-semibold text-white">Our Team</h2>
          <p className="mt-5 text-xl text-white/70 max-w-3xl font-medium mx-auto">
            Phasellus imperdiet semper turpis eget sollicitudin. Nunc ullamcorper
            varius ligula eu sagittis. Vivamus vel fermentum arcu.
          </p>
        </div>

        {/* Team Image Placeholder */}
        <div className="mt-12 flex justify-center">
          <div className="bg-white rounded shadow-xl p-2">
            <div className="relative w-[90vw] max-w-4xl h-[250px] md:h-[475px] bg-gray-300 rounded">
              <Image
                src="/images/team-placeholder.png"
                alt="Our Team"
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
