"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Base1 from "../Base1";
import Image from "next/image";
import { useEffect } from "react";

const Card4 = () => {
  const bgRef = useRef<HTMLDivElement | null>(null);

  const stripRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!stripRef.current) return;

    // GSAP Animation
    gsap.to(stripRef.current, {
      x: 400, // move horizontally (left -> right)
      y: 300, // move vertically (top -> bottom)
      duration: 3, // total animation duration in seconds
      ease: "power2.inOut", // smooth easing
      repeat: -1, // infinite loop
      yoyo: true, // reverse back to starting position
    });
  }, []);

  useGSAP(() => {
    const images = [
      "url('/icons/zero-one1.svg')",

      "url('/icons/zero-one3.svg')",
      "url('/icons/zero-one4.svg')",
      "url('/icons/zero-one2.svg')",

      "url('/icons/zero-one5.svg')",
    ];

    let index = 0;

    const changeBackground = () => {
      gsap.to(bgRef.current, {
        duration: 1,
        onComplete: () => {
          if (bgRef.current) {
            bgRef.current.style.backgroundImage = images[index];
          }
          gsap.to(bgRef.current, { duration: 5000 });
        },
      });

      index = (index + 1) % images.length;
    };

    // Run background change every 2 seconds
    const interval = setInterval(changeBackground, 1000);

    return () => clearInterval(interval); // cleanup on unmount
  });

  return (
    <div
      className="bg-gradient-to-b relative from-[#2A2E34] to-[#525252] rounded-xl  overflow-hidden"
      style={{
        width: "346.22px",
        height: "241.05px",
      }}
    >
      {/* Animated Background */}
      <div
        ref={bgRef}
        className="h-[41%] w-full scale-200"
        style={{
          backgroundImage: "url('/icons/zero-one1.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transformOrigin: "top left",
        }}
      ></div>

      {/* Static Icon */}
      <div
        className=" absolute  lock-masking  left-50 transform translate-x-[-100%] top-12"
        style={{
          width: "67.94px",
          height: "98.3px",
          backgroundImage: "url('/icons/num-lock.svg')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        {/* <Image
          src="/icons/key-hole.svg"
          alt=""
          width={9}
          height={9}
          className="absolute key-hole-masking  transform -translate-x-1/2  top-[45%] left-1/2"
        /> */}

        <Image
          ref={stripRef}
          src="/icons/three-strip.svg"
          alt=""
          width={350}
          height={550}
          className="strip absolute scale-200 bottom-[60px] left-[-80px] "
        />
      </div>

      {/* Base Text Component */}
      <Base1
        title="Data Encryption"
        content="Fusce vehicula rutrum lectus, ut posuere libero sodales at. Praesent erat quam,"
        libero="pr-15"
      />
    </div>
  );
};

export default Card4;
