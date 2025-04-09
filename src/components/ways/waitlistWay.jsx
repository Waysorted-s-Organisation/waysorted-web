"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SocialIcons from "../../components/ui/socialIcons";
import Button from "../ui/button";
import CenteredModal from "../ui/waitlistModal";
const WaitlistWay = ({ goToNextPage }) => {
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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

  // Modified star variants to include staggered delays
  // Base animation for stars
  const createStarVariants = (delay) => ({
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
      },
    },
    exit: { opacity: 0, scale: 0.8 },
  });

  // Create individual variants with different delays
  const star1Variants = createStarVariants(0);
  const star2Variants = createStarVariants(1);
  const star3Variants = createStarVariants(2);
  const star4Variants = createStarVariants(2.5);
  const star5Variants = createStarVariants(3);

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
            <button className="w-[80px] sm:w-[90px] md:w-[109px] h-[36px] sm:h-[40px] md:h-[48px] rounded-full transition duration-500 flex items-center justify-center text-[#FCFDFF] z-10 bg-[#180B3A] hover:bg-[#FFCD00] hover:text-[#FCFDFF] hanken-font-regular text-sm md:text-lg">
              WayMail
            </button>
          </a>
        </div>
      </header>

      {/* Main Content Group - Contains Logo, Heading, Stars, and Scroll */}
      <div className="flex-1 flex flex-col relative">
        {/* Content Wrapper - Groups logo, heading, waitlistWayTab and scroll */}
        <div className="flex flex-col items-center z-10 relative md:gap-4 gap-8">
          {/* Logo */}
          <motion.div
            key="waitlistLogo"
            className="w-full flex justify-center mt-20 md:mt-8"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            <div className="w-[180px] sm:w-[140px] md:w-[150px]">
              <img
                src="svgs/joinWay/fundLogo.svg"
                alt="waysorted"
                className="w-full h-auto max-w-full"
              />
            </div>
          </motion.div>

          <div className="flex flex-col items-center z-10 relative gap-1">
            {/* Heading - Desktop */}
            <motion.main
              key="waitlistHeading"
              className="hidden md:flex flex-col items-center justify-center text-center mt-16 px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-none text-6xl lg:text-7xl xl:text-8xl hanken-font-bold max-w-6xl text-[#FCFDFF]">
                Join Way's <span className="text-[#FFCD00]">Waitlist!</span>
              </h1>
            </motion.main>

            {/* Heading - Mobile */}
            <motion.main
              key="waitlistHeadingMobile"
              className="md:hidden flex flex-col items-center justify-center text-center md:mt-8 mt-12  px-4"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="leading-tight text-4xl xs:text-4xl sm:text-5xl hanken-font-bold text-[#FCFDFF]">
                Join Way's <br />{" "}
                <span className="text-[#FFCD00]">Waitlist!</span>
              </h1>
            </motion.main>

            {/* WaitlistWayTab - Positioned between heading and scroll */}
            <motion.div
              key="waitlistway"
              className="flex justify-center mt-2 md:mt-8"
              variants={headingVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                label="Join now"
                className="bg-[#FCFDFF] text-white text-2xl hanken-font-medium"
                circleClassName="bg-[#180B3A]"
                onClick={openModal}
              />

              <CenteredModal isOpen={isModalOpen} onClose={closeModal} />
            </motion.div>

            {/* Scroll Down */}
            <div
              className="w-full flex justify-center mt-2 md:mt-6 cursor-pointer"
              onClick={goToNextPage}
            >
              <p className="text-xl sm:text-lg md:text-xl hanken-font-medium text-[#FFFFFF]/50">
                Thats's way for you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stars container - positioned absolutely relative to main content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Each star now has its own animation variant with different delays */}
        <motion.div
          key="star1"
          className="absolute md:-top-8 md:left-1/2 mt-10 -left-8"
          style={{ transformOrigin: "center" }}
          variants={star1Variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/star4.gif"
            alt="star1"
            className="max-w-[100px] h-auto"
          />
        </motion.div>
        <motion.div
          key="star2"
          className="md:block absolute md:top-80 md:left-2 top-1/3 -left-4"
          style={{ transformOrigin: "center" }}
          variants={star2Variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/star5.gif"
            alt="star2"
            className="max-w-[100px] h-auto"
          />
        </motion.div>
        <motion.div
          key="star3"
          className="md:block absolute md:top-0 md:left-20 bottom-1/6 -left-8"
          style={{ transformOrigin: "center" }}
          variants={star3Variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/star.gif"
            alt="star3"
            className="max-w-[100px] h-auto"
          />
        </motion.div>
        <motion.div
          key="star4"
          className="md:block absolute md:top-48 md:right-12 top-1/6 -right-8"
          style={{ transformOrigin: "center" }}
          variants={star4Variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/star3.gif"
            alt="star4"
            className="max-w-[100px] h-auto"
          />
        </motion.div>
        <motion.div
          key="star5"
          className="md:block absolute md:bottom-32 md:right-40 bottom-1/8 -right-4"
          style={{ transformOrigin: "center" }}
          variants={star5Variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src="/gif/star.gif"
            alt="star5"
            className="max-w-[100px] h-auto"
          />
        </motion.div>
      </div>

      {/* Mascot - positioned at the bottom */}
      <motion.div
        key="mascotWaitlist"
        className="fixed md:-bottom-28 md:-left-32 -bottom-12 -left-20 overflow-hidden"
        variants={mascotVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src="/gif/mascot4.gif"
          alt="Mascot"
          className="h-auto max-w-[325px] md:max-w-full"
        />
      </motion.div>

      {/* Social Icons */}
      <div className="hidden md:flex absolute bottom-8 right-12 space-x-4 ">
        <SocialIcons className="bg-[#543197] text-[#FCFDFF] hover:bg-[#FCFDFF] hover:text-[#543197] transition-colors duration-500" />
      </div>

      <div className="flex md:hidden absolute top-8 left-4 space-x-2 ">
        <SocialIcons className="bg-[#543197] text-[#FCFDFF] hover:bg-[#FCFDFF] hover:text-[#543197] transition-colors duration-500 scale-90 z-20" />
      </div>
    </div>
  );
};

export default WaitlistWay;
