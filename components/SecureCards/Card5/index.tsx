import React, { useRef } from "react";
import Base1 from "../Base1";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { animate, svg } from "animejs";
import { useEffect } from "react";

const Card5 = () => {
  const bgRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    gsap.to(bgRef.current, {
      duration: 7,
      repeat: -1,
      rotate: 360,
      ease: "linear", // smooth infinite rotation
      transformOrigin: "center center", // rotate around top-center
    });
  });

  useEffect(() => {
    // Moving dot along path
    animate(".moving-dot", {
      duration: 4000,
      ease: "linear",
      loop: true,
      ...svg.createMotionPath("#motionPath"), // animates translateX, translateY, rotate
    });
  }, []);

  return (
    <div
      className="bg-gradient-to-b from-[#2A2E34] to-[#525252]  absolute rounded-xl overflow-hidden  "
      style={{
        width: "312.71px",
        height: "455.11px",
      }}
    >
      {/* Animated Background */}
      <div
        ref={bgRef}
        className="h-[76%] w-full "
        style={{
          backgroundImage: "url('/icons/rotate-dot1.svg')",
          backgroundPosition: "center",
        }}
      ></div>
      <Image
        src="/icons/cpu.svg"
        alt="lock"
        width={249}
        height={210}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <svg
        width="95"
        height="55"
        viewBox="0 0 95 55"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-[56%] left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <path
          d="M1 49.5L44 24.5M44 24.5V0M44 24.5L94.5 54"
          stroke="#787878"
          stroke-dasharray="2 2"
          id="motionPath"
        />
        <circle className="moving-dot" r="5" fill="#787878" />
      </svg>
      <Base1
        title={"Data Encryption"}
        content={
          "Fusce vehicula rutrum lectus, ut posuere libero sodales at. Praesent erat quam,"
        }
        libero="pr-5"
      />
    </div>
  );
};

export default Card5;
