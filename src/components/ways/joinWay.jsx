"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SocialIcons from "../../components/ui/socialIcons";


import Button from "../ui/button";

const JoinWay = ({ goToNextPage }) => {
  const [windowHeight, setWindowHeight] = useState(0);

  const logoVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  const headingVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  // Floating elements with rotate animation
  const magnifyingVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: [-5, 5, -10],
      transition: {
        rotate: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 },
      },
    },
    exit: { opacity: 0, scale: 0.8 },
  };

  // Mascot variants
  const mascotVariants = {
    initial: { opacity: 0, scale: 0.8, x: "-100%", y: "100%" },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: "-100%",
      y: "100%",
      transition: {
        duration: 0.5,
        ease: "easeIn",
      },
    },
  };

  return (
    <div className="relative w-full overflow-hidden flex flex-col h-screen">
      {/* Header */}
      <header className="w-full py-4 md:py-6 px-4 md:px-8 flex justify-end items-center relative mt-8 md:mt-6 z-20">
        <div className="absolute right-4 sm:right-6 md:right-12">
        <a href="mailto:waysorted@gmail.com">
          <button className="w-[80px] sm:w-[90px] md:w-[109px] h-[36px] sm:h-[40px] md:h-[48px] rounded-full transition duration-500 flex items-center justify-center text-[#FCFDFF] z-10 bg-[#5C1909] hover:bg-[#A83417] hover:text-[]#FCFDFF hanken-font-regular text-sm md:text-lg">
            WayMail
          </button>
          </a>
        </div>
      </header>

      {/* Main Content Group - Contains Logo, Heading, Magnifying glasses, and Scroll */}
      <div className="flex-1 flex flex-col relative">
        {/* Content Wrapper - Groups logo, heading, joinWayTab and scroll */}
        <div className="flex flex-col items-center z-10 relative md:gap-4 gap-8">
          {/* Logo */}
          <motion.div
            key="fundLogo"
            className="w-full flex justify-center mt-12 md:mt-8"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            <div className="w-[180px] sm:w-[140px] md:w-[150px]">
              <img
                src="/svgs/joinWay/fundLogo.svg"
                alt="waysorted"
                className="w-full h-auto max-w-full"
              />
            </div>
          </motion.div>

          <div className="flex flex-col items-center z-10 relative gap-1">
            {/* Heading - Desktop */}
            <motion.main
              key="fundHeading"
              className="hidden md:flex flex-col items-center justify-center text-center mt-16 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-none text-6xl lg:text-7xl xl:text-8xl hanken-font-bold max-w-6xl text-[#131B23]">
                Way is <span className="text-[#FCFDFF]">Hiring!</span>
              </h1>
            </motion.main>

            {/* Heading - Mobile */}
            <motion.main
              key="fundHeadingMobile"
              className="md:hidden flex flex-col items-center justify-center text-center mt-16 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-tight text-4xl xs:text-4xl sm:text-5xl hanken-font-bold text-[#131B23]">
                Way is <span className="text-[#FCFDFF]">Hiring!</span>
              </h1>
            </motion.main>

            {/* JoinWayTab - Positioned between heading and scroll */}
            <motion.div
              key="joinWay"
              className="flex justify-center md:mt-8 mt-2"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.3 }}
            >
            <a href="https://www.linkedin.com/jobs/view/4204500667/">
              <Button
                label="Join Way"
                className="bg-[#FCFDFF] text-white text-2xl hanken-font-medium"
                circleClassName="bg-[#5C1909]"
              ></Button>
              </a>
            </motion.div>

            {/* Scroll Down */}
            <div
              className="w-full flex justify-center mt-4 cursor-pointer"
              onClick={goToNextPage}
            >
              <p className="text-xl sm:text-lg md:text-xl hanken-font-medium text-[#FFFFFF]/50">
                keep scrolling
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Magnifying glasses container - positioned absolutely relative to main content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Desktop Floating Elements */}
        <motion.div
          key="magnifying1Desktop"
          className=" md:block absolute md:top-16 md:left-4 top-32 -left-8"
          variants={magnifyingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/svgs/joinWay/Magnifying1.svg"
            alt="Magnifying1"
            className="md:max-w-full max-w-[150px] h-auto"
          />
        </motion.div>

        <motion.div
          key="magnifying2Desktop"
          className=" md:block absolute md:top-68 md:right-6 top-1/2 -right-8"
          variants={magnifyingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/svgs/joinWay/Magnifying2.svg"
            alt="Magnifying2"
            className="md:max-w-full max-w-[150px] h-auto"
          />
        </motion.div>
      </div>

      {/* Mascot - positioned at the bottom */}
      <motion.div
        key="mascotFund"
        className="hidden sm:block absolute -bottom-48 -left-32 overflow-hidden"
        variants={mascotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src="/gif/mascot2.gif"
          alt="Mascot"
          className="w-auto h-auto max-w-[510px]"
        />
      </motion.div>

      {/* Mobile-only smaller mascot */}
      <motion.div
        key="mascotFundMobile"
        className=" -bottom-28 -left-16 z-10 block sm:hidden overflow-hidden fixed"
        variants={mascotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src="/gif/mascot2.gif"
          alt="Mascot"
          className="w-auto h-auto max-w-[325px]"
        />
      </motion.div>

      {/* Social Icons */}
      <div className="hidden md:flex absolute bottom-8 right-12 space-x-2 z-10">
        <SocialIcons className="bg-[#5C1909] text-[#FF9378] hover:bg-[#FF9378] hover:text-[#5C1909] transition-colors duration-500" />
      </div>

      <div className="flex md:hidden absolute top-8 left-4 space-x-2">
        <SocialIcons className="bg-[#5C1909] text-[#FF9378] hover:bg-[#FF9378] hover:text-[#5C1909] transition-colors duration-500 scale-90 z-20" />
      </div>
    </div>
  );
};

export default JoinWay;
