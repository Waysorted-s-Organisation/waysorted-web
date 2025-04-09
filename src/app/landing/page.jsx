"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, useAnimationControls } from "framer-motion";
import StartWay from "../../components/ways/startWay";
import JoinWay from "../../components/ways/joinWay";
import FundWay from "../../components/ways/fundWay";
import WaitlistWay from "../../components/ways/waitlistWay";
import TEXT from "../../../public/svgs/text/TEXT.svg";
import WaitlistText from "../../../public/svgs/text/waitlistwaytext.svg";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import animationData from "../../../assets/lottie/datablue.json";
import animationData2 from "../../../assets/lottie/data.json";

const Landing = () => {
  const [currentPage, setCurrentPage] = useState("start");
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const lottieRef = useRef(null);
  const lottieAnimationControls = useAnimationControls();
  const isScrollingRef = useRef(false);

  // Function to navigate to the next page with cycle restriction
  const goToNextPage = () => {
    if (currentPage === "start") setCurrentPage("join");
    else if (currentPage === "join") setCurrentPage("fund");
    else if (currentPage === "fund") setCurrentPage("waitlist");
    // No longer cycling back to "start" from "waitlist"
  };

  // Function to navigate to the previous page
  const goToPrevPage = () => {
    if (currentPage === "waitlist") setCurrentPage("fund");
    else if (currentPage === "fund") setCurrentPage("join");
    else if (currentPage === "join") setCurrentPage("start");
    // No longer cycling back to "waitlist" from "start"
  };

  useEffect(() => {
    const handleWheel = (event) => {
      if (isScrollingRef.current) return;

      // Scroll down to go to next page
      if (event.deltaY > 0) {
        // Don't proceed if already at waitlist
        if (currentPage !== "waitlist") {
          goToNextPage();
          isScrollingRef.current = true;
        }
      }
      // Scroll up to go to previous page
      else if (event.deltaY < 0) {
        // Don't proceed if already at start
        if (currentPage !== "start") {
          goToPrevPage();
          isScrollingRef.current = true;
        }
      }

      // Add a cooldown to prevent rapid scrolling
      if (isScrollingRef.current) {
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1200);
      }
    };

    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [currentPage]);

  // Update swipe detection for bidirectional navigation
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (isScrollingRef.current) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchDiff = touchStartY - touchEndY;

      // Swipe down (positive difference)
      if (touchDiff > 50 && currentPage !== "waitlist") {
        goToNextPage();
        isScrollingRef.current = true;
      }
      // Swipe up (negative difference)
      else if (touchDiff < -50 && currentPage !== "start") {
        goToPrevPage();
        isScrollingRef.current = true;
      }

      // Add cooldown if swiping
      if (isScrollingRef.current) {
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 1200);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentPage]);

  // Initialize the Lottie animation with slow speed
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1);
    }
  }, []);

  // Update the speed whenever the hover state changes
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(isButtonHovered ? 1.9 : 1);
    }
  }, [isButtonHovered]);

  const handleNextClick = () => {
    // Only allow navigation if not on waitlist
    if (currentPage !== "waitlist") {
      goToNextPage();
    }
    // If on waitlist, do nothing (button shows but doesn't navigate)
  };

  const handleButtonHover = () => {
    setIsButtonHovered(true);
    lottieAnimationControls.start({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeInOut" },
    });
  };

  const handleButtonLeave = () => {
    setIsButtonHovered(false);
    lottieAnimationControls.start({
      opacity: 0.7,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    });
  };

  const bgVariants = {
    start: { backgroundColor: "#FFFFFF" },
    join: { backgroundColor: "#EA613F" },
    fund: { backgroundColor: "#01A04E" },
    waitlist: { backgroundColor: "#39187A" },
  };

  const selectedAnimationData =
    currentPage === "start" ? animationData : animationData2;

  return (
    <motion.div
      className="min-h-screen flex flex-col relative overflow-hidden"
      variants={bgVariants}
      initial={currentPage}
      animate={currentPage}
      transition={{ duration: 1 }}
    >
      {currentPage === "start" && <StartWay />}
      {currentPage === "join" && <JoinWay />}
      {currentPage === "fund" && <FundWay />}
      {currentPage === "waitlist" && <WaitlistWay />}

      {/* Desktop Lottie Animation - Hidden on mobile */}
      <motion.div
        animate={lottieAnimationControls}
        initial={{ opacity: 0.8, scale: 1 }}
        className="hidden md:block absolute left-1/2 transform -translate-x-[49%] overflow-hidden"
        style={{
          width: "min(100vw, 800px)",
          height: "min(100vh, 400px)",
          bottom: "0px",
        }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={selectedAnimationData}
          loop={true}
          autoplay={true}
        />
      </motion.div>

      {/* Navigation button - Always visible but doesn't navigate when on waitlist */}
      <div
        className={`hidden fixed bottom-0 left-1/2 transform -translate-x-[46%] w-[160px] md:w-[215px] h-[80px] md:h-[107px] rounded-t-[110px] md:flex items-center justify-center transition duration-500 
        ${
          currentPage === "start"
            ? "bg-[#1F52AD]"
            : currentPage === "join"
            ? "bg-[#7F2B17]"
            : currentPage === "fund"
            ? "bg-[#D07D00]"
            : "bg-[#BF9900]"
        }`}
      >
        <motion.button
          onClick={handleNextClick}
          onMouseEnter={handleButtonHover}
          onMouseLeave={handleButtonLeave}
          onTouchStart={handleButtonHover}
          onTouchEnd={handleButtonLeave}
          className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[150px] md:w-[200px] h-[75px] md:h-[100px] rounded-t-[100px] flex items-center justify-center transition duration-500  
          ${
            currentPage === "start"
              ? "bg-[#265BD1]"
              : currentPage === "join"
              ? "bg-[#5C1909]"
              : currentPage === "fund"
              ? "bg-[#F49300]"
              : "bg-[#FFCD00]"
          }`}
          whileHover={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute -bottom-20 md:-bottom-28 left-1/2 transform -translate-x-1/2 origin-center w-[160px] md:w-[220px] h-[160px] md:h-[220px] flex items-center justify-center"
          >
            <Image
              src={currentPage === "waitlist" ? WaitlistText : TEXT}
              alt="TEXT"
              className="w-[120px] h-[120px] md:w-[170px] md:h-[170px]"
            />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Landing;
