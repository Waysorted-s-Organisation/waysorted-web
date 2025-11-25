"use client";

import React from "react";
import { motion } from "framer-motion";

const JoinCommunity = () => {
  return (
    <section className="bg-white flex flex-col items-center justify-center px-4 py-16 sm:py-24 md:py-40">
      {/* Heading (unchanged) */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-secondary-db-100 text-center leading-tight">
        Join Our Community
      </h1>

      {/* Subheading (unchanged) */}
      <p className="mt-3 sm:mt-4 text-secondary-db-80 font-medium
                    text-base sm:text-lg md:text-xl
                    text-center max-w-xl sm:max-w-2xl md:max-w-6xl">
        Be part of a growing network of designers who believe in faster, smarter,
        and frustration-free workflows.
      </p>

      {/* Animated Button */}
      {/* Switched from div to motion.div */}
      <motion.div
        className="mt-8 sm:mt-10 md:mt-12 rounded-4xl text-white font-medium
                   text-lg sm:text-2xl md:text-7xl
                   px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5
                   bg-secondary-db-100 join-shadow cursor-pointer
                   w-full max-w-xs sm:max-w-sm md:max-w-none md:w-2xl text-center"
        aria-label="Join our community"
        
        // --- Animation Props ---
        // Scale down slightly on hover
        whileHover={{ scale: 0.9 }}
        // Scale down a bit more when actually clicking/tapping
        whileTap={{ scale: 0.8 }}
        // Spring physics for that bouncy feel
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        Join Now !
      </motion.div>
    </section>
  );
};

export default JoinCommunity;