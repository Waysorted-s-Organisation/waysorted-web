"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SocialIcons from "../../components/ui/socialIcons";

const StartWay = ({ goToNextPage }) => {
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    // Set initial window height
    setWindowHeight(window.innerHeight);

    const setRealVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      setWindowHeight(window.innerHeight);
    };

    setRealVh();
    window.addEventListener("resize", setRealVh);
    return () => window.removeEventListener("resize", setRealVh);
  }, []);

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

  const floatCloud = (direction = 15) => ({
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      y: [0, direction, 0],
      transition: {
        y: {
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
  });

  const mascotVariants = {
    initial: { opacity: 0, scale: 0.8, x: "-100%", y: "100%" },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: "-100%",
      y: "100%",
      transition: { duration: 0.5, ease: "easeIn" },
    },
  };

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col"
      style={{
        height: `calc(var(--vh, 1vh) * 100)`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header */}
      <header className="w-full py-4 md:py-6 px-4 md:px-8 flex justify-end items-center relative mt-8 md:mt-6 z-20">
        <div className="absolute right-4 sm:right-6 md:right-12">
        <a href="mailto:waysorted@gmail.com">
            <button className="w-[80px] sm:w-[90px] md:w-[109px] h-[36px] sm:h-[40px] md:h-[48px] rounded-full transition duration-500 flex items-center justify-center hanken-font-regular text-white bg-[#3573FA] hover:bg-[#265BD1] text-sm md:text-lg">
              WayMail
            </button>
          </a>
        </div>
      </header>

      {/* Main Content Group - Contains Logo, Heading, Clouds, and Scroll */}
      <div className="flex-1 flex flex-col relative">
        {/* Content Wrapper - Groups logo, heading, and scroll */}
        <div className="flex flex-col items-center z-10 relative md:gap-4 gap-8">
          {/* Logo */}
          <motion.div
            key="startLogo"
            className="w-full flex justify-center mt-20 md:mt-8"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            <div className="w-[180px] sm:w-[140px] md:w-[150px]">
              <img
                src="/svgs/startWay/logo.svg"
                alt="waysorted"
                className="w-full h-auto max-w-full"
              />
            </div>
          </motion.div>

          <div className="flex flex-col items-center z-10 relative gap-1">
            {/* Heading - Desktop */}
            <motion.main
              key="startHeading"
              className="hidden md:flex flex-col items-center justify-center text-center mt-16 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-tight text-6xl lg:text-7xl xl:text-8xl hanken-font-bold max-w-6xl">
                We're building your <br /> <span>next </span>
                <span className="text-[#265BD1]">must-have tool!</span>
              </h1>
            </motion.main>

            {/* Heading - Mobile */}
            <motion.main
              key="startHeadingMobile"
              className="md:hidden flex flex-col items-center justify-center text-center mt-16 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="leading-tight text-[2.25rem]  xs:text-4xl sm:text-5xl hanken-font-bold">
                We're building{" "}
              </div>
              <div className="text-[#265BD1] leading-tight text-[2.25rem] xs:text-4xl sm:text-5xl hanken-font-bold -mt-2">
                <span className="text-black">your next </span>must-
              </div>
              <div className="text-[#265BD1] leading-tight text-[2.25rem]  xs:text-4xl sm:text-5xl hanken-font-bold -mt-2">
                have tool!
              </div>
            </motion.main>

            {/* Scroll Down - positioned based on available space */}
            <div
              className="w-full flex justify-center md:mt-auto  mt-4 cursor-pointer"
              onClick={goToNextPage}
            >
              <p className="text-md sm:text-lg md:text-xl hanken-font-medium text-[#959595]">
                scroll down
              </p>
            </div>
          </div>
        </div>

        {/* Clouds container - positioned absolutely relative to main content */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            key="cloud1"
            className="  absolute md:top-1/8 md:-left-4 top-1/6 -left-8"
            variants={floatCloud(-15)}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <img
              src="/svgs/startWay/cloud.svg"
              alt="cloud1"
              className="md:max-w-full max-w-[150px] h-auto"
            />
          </motion.div>

          <motion.div
            key="cloud3"
            className=" absolute md:top-1/2 md:-right-8 top-1/2 -right-6"
            variants={floatCloud(15)}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <img
              src="/svgs/startWay/cloud.svg"
              alt="cloud2"
              className="md:max-w-full max-w-[150px] h-auto"
            />
          </motion.div>
        </div>
      </div>

      {/* Mascot - positioned at the bottom */}
      <motion.div
        key="mascotDesktop"
        className="hidden sm:block absolute bottom-0 left-0  overflow-hidden"
        variants={mascotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src="/gif/mascot1.gif"
          alt="mascot"
          className="max-h-[120vh] w-auto max-w-full"
        />
      </motion.div>

      <motion.div
        key="mascotMobile"
        className="fixed -bottom-4 left-0 z-10 block sm:hidden overflow-hidden"
        variants={mascotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src="/gif/mascot1MOB.gif"
          alt="mascot"
          className="h-auto max-w-[375px]"
        />
      </motion.div>

      {/* Social Icons */}
      <div className="hidden md:flex absolute bottom-8 right-12 space-x-2 z-10">
        <SocialIcons className="bg-[#DFE8FA] text-[#265BD1] hover:bg-[#265BD1] hover:text-white transition-colors duration-500" />
      </div>

      <div className="flex md:hidden absolute top-8 left-4 space-x-2">
        <SocialIcons className="bg-[#DFE8FA] text-[#265BD1] hover:bg-[#265BD1] hover:text-white transition-colors duration-500 scale-90 z-20" />
      </div>
    </div>
  );
};

export default StartWay;
