"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SocialIcons from "../../components/ui/socialIcons";

import Button from "../../components/ui/button";

const FundWay = ({ goToNextPage }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check screen size
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logoVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  // Heading transition
  const headingVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  // Floating elements with rotate animation
  const dollarVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: [-5, 5, -5],
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
            <button className="w-[80px] sm:w-[90px] md:w-[109px] h-[36px] sm:h-[40px] md:h-[48px] rounded-full transition duration-500 flex items-center justify-center text-[#FCFDFF] bg-[#08833C] hover:bg-[#F49300] hover:text-[]#FCFDFF hanken-font-regular text-sm md:text-lg z-20">
              WayMail
            </button>
          </a>
        </div>
      </header>

      {/* Main Content Group - Contains Logo, Heading, Dollar signs, and Scroll */}
      <div className="flex-1 flex flex-col relative">
        {/* Content Wrapper - Groups logo, heading, fundWayTab and scroll */}
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
              key="hireHeading"
              className="hidden md:flex flex-col items-center justify-center text-center mt-16 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-none text-6xl lg:text-7xl xl:text-8xl hanken-font-bold max-w-6xl text-[#131B23]">
                Way needs <span className="text-[#FCFDFF]">Funding</span>
              </h1>
            </motion.main>

            {/* Heading - Mobile */}
            <motion.main
              key="fundHeadingMobile"
              className="md:hidden flex flex-col items-center justify-center text-center mt-10 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-tight text-4xl xs:text-4xl sm:text-5xl hanken-font-bold text-[#131B23]">
                Way needs <br /> <span className="text-[#FCFDFF]">Funding</span>
              </h1>
            </motion.main>

            {/* FundWayTab - Positioned between heading and scroll */}
            <motion.div
              key="FundWay"
              className="flex justify-center md:mt-8 mt-2"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <a href="mailto:waysorted@gmail.com?subject=Support%20Inquiry&body=Full%20Name:%20%5BEnter%20your%20name%5D%0D%0AEmail:%20%5BEnter%20your%20email%5D%0D%0APhone:%20%5BEnter%20your%20phone%20number%5D%0D%0AOrganization:%20%5BEnter%20organization%20name%5D%0D%0APreferred%20Mode%20of%20Communication:%20%5BEmail/Phone/WhatsApp%5D%0D%0AMessage:%20%5BEnter%20your%20message%5D">
                <Button
                  label="Fund Way"
                  className="bg-[#FCFDFF] text-white hanken-font-medium"
                  circleClassName="bg-[#08833C]"
                />
              </a>
            </motion.div>

            {/* Scroll Down */}
            <div
              className="w-full flex justify-center mt-4 cursor-pointer"
              onClick={goToNextPage}
            >
              <p className="text-xl sm:text-lg md:text-xl hanken-font-medium text-[#FFFFFF]/50">
                almost there!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Desktop Floating Elements */}
        <motion.div
          key="dollar2"
          className=" md:block absolute md:top-1/8 md:left-0 top-1/6 left-2"
          style={{ transformOrigin: "center" }}
          variants={dollarVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/dollar.gif"
            alt="Dollar1"
            className="md:max-w-[250px] max-w-[150px] h-auto"
          />
        </motion.div>

        <motion.div
          key="dollar1"
          className="md:block absolute md:bottom-32 md:right-4 top-1/2 -right-8"
          style={{ transformOrigin: "center" }}
          variants={dollarVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/dollar.gif"
            alt="Dollar1"
            className="md:max-w-[250px] max-w-[150px] h-auto"
          />
        </motion.div>

        <motion.div
          key="dollar3"
          className=" md:block absolute md:-top-16 md:right-96 -top-8 right-8"
          style={{ transformOrigin: "center" }}
          variants={dollarVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/dollar.gif"
            alt="Dollar1"
            className="md:max-w-[250px] max-w-[150px] h-auto"
          />
        </motion.div>
      </div>

      {/* Mascot - positioned at the bottom */}
      <motion.div
        key="mascotFund"
        className="sm:block md:-bottom-48 md:-left-32 -bottom-28 -left-16 z-10 overflow-hidden fixed"
        variants={mascotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src="/gif/mascot3.gif"
          alt="Mascot"
          className="h-auto max-w-[325px] md:max-w-full"
        />
      </motion.div>

      {/* Social Icons */}
      <div className="hidden md:flex absolute bottom-8 right-12 space-x-4 z-10">
        <SocialIcons className="bg-[#08833C] text-[#FCFDFF] hover:bg-[#FCFDFF] hover:text-[#08833C] transition-colors duration-500" />
      </div>

      <div className="flex md:hidden absolute top-8 left-4 space-x-2">
        <SocialIcons className="bg-[#08833C] text-[#FCFDFF] hover:bg-[#FCFDFF] hover:text-[#08833C] transition-colors duration-500 scale-90 z-20" />
      </div>
    </div>
  );
};

export default FundWay;
