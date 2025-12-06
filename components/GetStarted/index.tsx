"use client";

import React from "react";
import { motion } from "framer-motion";

// Configuration for your 8 SVG assets
// Adjust the 'x' and 'y' values if specific icons (like the text bubbles) 
// land in spots where they look crowded.
const FLOATING_ITEMS = [
  {
    id: 1,
    src: "/icons/get-started-1.svg",
    x: -297, y: -95, delay: 0.1,
    className: "h-12 w-auto" // Top-left area
  },
  {
    id: 2,
    src: "/icons/get-started-2.svg",
    x: -370, y: -19, delay: 0.05,
    className: "h-auto w-auto" // Top-left (higher)
  },
  {
    id: 3,
    src: "/icons/get-started-3.svg",
    x: -387, y: 53, delay: 0.15,
    className: "h-auto w-auto" // Top-right
  },
  {
    id: 4,
    src: "/icons/get-started-4.svg",
    x: -247, y: 117, delay: 0.1,
    className: "h-auto w-auto" // Top-right (lower)
  },
  {
    id: 5,
    src: "/icons/get-started-5.svg",
    x: 287, y: -117, delay: 0.2,
    className: "h-auto w-auto" // Bottom-right
  },
  {
    id: 6,
    src: "/icons/get-started-6.svg",
    x: 400, y: -56, delay: 0.15,
    className: "h-auto w-auto" // Bottom-right (closer)
  },
  {
    id: 7,
    src: "/icons/get-started-7.svg",
    x: 327, y: 100, delay: 0.1,
    className: "h-auto w-auto" // Bottom-left
  },
  {
    id: 8,
    src: "/icons/get-started-8.svg",
    x: 230, y: 117, delay: 0.2,
    className: "h-auto w-auto" // Left
  },
];

const GetStarted = () => {
  return (
    <section className="bg-white flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 md:py-40 overflow-hidden">
      {/* Heading and Subtext (z-index ensures they sit above floating elements if they overlap) */}
      <div className="relative z-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-secondary-db-100 text-center leading-tight select-none">
          One tool. Infinite possibilities.
        </h1>
        <p className="mt-3 sm:mt-4 text-secondary-db-80 font-medium text-base sm:text-lg md:text-xl text-center max-w-xl sm:max-w-2xl md:max-w-6xl mx-auto select-none">
          Waysorted transforms your workflow,<span className="text-primary-way-100"> Instantly.</span>
        </p>
      </div>

      {/* INTERACTIVE CONTAINER */}
      <motion.div 
        className="relative mt-12 sm:mt-16 md:mt-24 flex items-center justify-center"
        initial="initial"
        whileHover="hover"
        // "animate" is optional here, but 'whileHover' handles the interaction automatically
      >
        
        {/* FLOATING SVGs (Behind the button) */}
        {FLOATING_ITEMS.map((item) => (
          <motion.img
            key={item.id}
            src={item.src}
            alt={`Floating icon ${item.id}`}
            className={`absolute select-none pointer-events-none ${item.className}`} 
            // The className handles sizing (h-12 w-auto preserves aspect ratio)
            
            variants={{
              initial: { 
                x: 0, 
                y: 0, 
                opacity: 0, 
                scale: 0.5, 
              },
              hover: { 
                x: item.x, 
                y: item.y, 
                opacity: 1, 
                scale: 1, 
                transition: {
                  type: "spring",
                  stiffness: 180,
                  damping: 15,
                  delay: item.delay 
                }
              }
            }}
          />
        ))}

        {/* MAIN BUTTON */}
        <motion.div
          className="relative join-shadow z-20 md:rounded-3xl rounded-lg text-white font-medium
                     text-lg sm:text-2xl md:text-7xl
                     px-18 py-6 sm:px-20 sm:py-8 md:px-25 md:py-10
                     bg-secondary-db-100 shadow-2xl cursor-pointer
                     w-full max-w-xs sm:max-w-sm md:max-w-none md:w-auto text-center select-none"
          aria-label="Get Started Button"
          variants={{
            initial: { scale: 1 },
            hover: { scale: 0.8 }
          }}
          whileTap={{ scale: 0.7 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          Get Started!
        </motion.div>

        {/* Button Glow Effect */}
        <div className="absolute inset-0 bg-secondary-db-100 blur-3xl opacity-20 z-0 rounded-full pointer-events-none" />
        
      </motion.div>
    </section>
  );
};

export default GetStarted;