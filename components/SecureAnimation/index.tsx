"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BigEllipseSvg from "./BigEllipseSvg/index";

gsap.registerPlugin(ScrollTrigger);

const SecureAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const circles = gsap.utils.toArray<HTMLImageElement>(".crcl");
    const astrcs = gsap.utils.toArray<HTMLImageElement>(".astrc");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        pin: true,
        markers: false,
      },
    });

    // circles pop-up animation
    tl.to(circles, {
      y: "-120px",
      opacity: 1,
      stagger: 0.6,
      ease: "linear",
      duration: 2.4,
    });

    // fade background starting when 2nd circle pops and complete before 4th
    // since stagger is 0.5, first circle animates at 0, second at 0.5, third at 1, fourth at 1.5
    // so we can start fade at ~0.5 and end around ~1.2 timeline position
    tl.to(
      bgRef.current,
      { opacity: 0.6, duration: 0.24, ease: "linear" },
      "3"
      // absolute position in timeline where 2nd circle starts animating
    );

    // // heading fade in after all circles popped
    tl.to(".top-text", { opacity: 1, ease: "linear" }, ">"); // after previous animations
    tl.to(
      astrcs,
      {
        stagger: 0.4,
        opacity: 1,
        ease: "linear",
        duration: 2,
      },
      ">"
    ); // at same time as bottom text

    // tl.to(".top-text", { opacity: 0, ease: "linear" }, 1.5); // move up at same time as fade in
    tl.to(".bottom-text", { opacity: 1, ease: "linear", duration: 1 }, "<"); // after previous animations
    tl.to(".bottom-text", { opacity: 0, ease: "linear", duration: 1 }, 5); // after previous animations
    tl.to(".top-text", { opacity: 0, ease: "linear", duration: 1 }, "<");

    // // at same time as bottom text
    // after previous animations
    tl.to(
      "ellipse",
      {
        fill: "#D44040",
        "fill-opacity": 1,
      },
      ">"
    );

    tl.to(
      "#outerStop1",
      { attr: { "stop-color": "#6B6B6B" }, duration: 1 },
      "<"
    );
    tl.to(
      "#outerStop2",
      { attr: { "stop-color": "#1A0101" }, duration: 1 },
      "<"
    );

    tl.to(
      "#innerStop1",
      { attr: { "stop-color": "#838383" }, duration: 1 },
      "<"
    );
    tl.to(
      "#innerStop2",
      { attr: { "stop-color": "#3E1010" }, duration: 1 },
      "<"
    );
    tl.to(
      "#astrc-stop1",
      {
        attr: { "stop-color": "#D35555" },
        duration: 1,
      },
      "<"
    );
    tl.to(
      "#astrc-stop2",
      {
        attr: { "stop-color": "#797979" },
        duration: 1,
      },
      "<"
    );

    tl.to(
      "#outerStop1",
      { attr: { "stop-color": "#800606" }, duration: 1 },
      ">"
    );
    tl.to("#glowCircle", { opacity: 1, duration: 1 }, "<");
    tl.to(
      "#outerStop2",
      { attr: { "stop-color": "#800606" }, duration: 1 },
      "<"
    );
    tl.to(".top-text-2", { opacity: 1, ease: "linear", duration: 1 }, "<");
    tl.to(
      "#grad1 stop:nth-child(1)",
      { stopColor: "#FF0000", opacity: 1, duration: 1 },
      "<"
    );
    tl.to(
      "#grad1 stop:nth-child(2)",
      { stopColor: "#FF0000", opacity: 1, duration: 1 },
      "<"
    );

    tl.to(
      "#innerStop1",
      { attr: { "stop-color": "#A42929" }, duration: 1 },
      "<"
    );
    tl.to(
      "#innerStop2",
      { attr: { "stop-color": "#A42929" }, duration: 1 },
      "<"
    );
    tl.to(
      "#astrc-stop1",
      {
        attr: { "stop-color": "#D35555" },
        duration: 1,
      },
      "<"
    );
    tl.to(
      "#astrc-stop2",
      {
        attr: { "stop-color": "#790000" },
        duration: 1,
      },
      "<"
    );

    tl.to(
      "#red-glowCircle",
      {
        attr: { "stroke-opacity": 1 },
        duration: 1,
      },
      "<"
    );

    // tl.to(".top-text-2", { opacity: 0, ease: "linear" }, ">");
    // after previous animations
    tl.to(".bottom-text-2", { opacity: 1, ease: "linear", duration: 1 }, ">");
    // after previous animations
    tl.to(
      "#outerStop1",
      { attr: { "stop-color": "#D35555" }, duration: 1 },
      "<"
    );
    tl.to(
      "#outerStop2",
      { attr: { "stop-color": "#0F8D2A" }, duration: 1 },
      "<"
    );

    tl.to(
      "#innerStop1",
      { attr: { "stop-color": "#800606" }, duration: 1 },
      "<"
    );
    tl.to(
      "#innerStop2",
      { attr: { "stop-color": "#0F8D2A" }, duration: 1 },
      "<"
    );
    tl.to(
      "#astrc-stop1",
      {
        attr: { "stop-color": "#0F8D2A" },
        duration: 1,
      },
      "<"
    );
    tl.to(
      "#astrc-stop2",
      {
        attr: { "stop-color": "#A42929" },
        duration: 1,
      },
      "<"
    );
    tl.to(
      "#grad1 stop:nth-child(1)",
      { stopColor: "#FF0000", duration: 1 },
      "<"
    );
    tl.to(
      "#grad1 stop:nth-child(2)",
      { stopColor: "#0F8D2A", duration: 1 },
      "<"
    );

    tl.to(
      "#outerStop1",
      { attr: { "stop-color": "#06802B" }, duration: 1 },
      ">"
    );
    tl.to(
      "#outerStop2",
      { attr: { "stop-color": "#06802B" }, duration: 1 },
      "<"
    );

    tl.to(
      "#innerStop1",
      { attr: { "stop-color": "#29A45A" }, duration: 1 },
      "<"
    );
    tl.to(
      "#innerStop2",
      { attr: { "stop-color": "#29A45A" }, duration: 1 },
      "<"
    );
    tl.to(
      "#astrc-stop1",
      {
        attr: { "stop-color": "#55D364" },
        duration: 1,
      },
      "<"
    );
    tl.to(
      "#astrc-stop2",
      {
        attr: { "stop-color": "#00791C" },
        duration: 1,
      },
      "<"
    );
    tl.to(
      "#grad1 stop:nth-child(1)",
      { stopColor: "#00FF2F", duration: 1 },
      "<"
    );
    tl.to(
      "#grad1 stop:nth-child(2)",
      { stopColor: "#00FF2F", duration: 1 },
      "<"
    );
    tl.to(
      "ellipse",
      {
        fill: "#0F8D2A",
        "fill-opacity": 1,
      },
      "<"
    );
    tl.to(".blank-page", { duration: 2 }, ">");

    gsap.to("#vibration", {
      x: 17,
      duration: 0.05,
      yoyo: true,
      repeat: -1, // infinite vibration
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#vibration",
        start: "550% 76%",
        end: "600% 71%",
        toggleActions: "play pause resume reset",
        // markers: true,
      },
    });
  });

  return (
    <div
      ref={containerRef}
      className="w-[100%] h-[100vh] overflow-x-hidden overflow-y-hidden right-0 bg-[#0D1218] absolute "
    >
      <div
        ref={bgRef}
        className=" absolute flex px-auto -top-2 inset-0  w-full h-full opacity-0"
      >
        <BigEllipseSvg />
      </div>

      <h1
        className=" top-text hanken-font  text-7xl bold capitalize text-center opacity-0 translate-y-[21vh]"
        style={{
          background: "linear-gradient(to top, #FFFFFF 0%, #828282 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        The data you create is yours
      </h1>

      <div className="w-full   flex items-center justify-center top-1/2 gap-6 relative ">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative">
            <svg
              id="vibration"
              width="109"
              height="109"
              viewBox="0 0 109 109"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="crcl opacity-0"
            >
              <defs>
                {/* Outer circle gradient */}
                <linearGradient
                  id="outerGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop id="outerStop1" offset="0%" stop-color="#fff" />
                  <stop id="outerStop2" offset="100%" stop-color="#fff" />
                </linearGradient>

                {/* Inner circle gradient */}
                <linearGradient
                  id="innerGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop id="innerStop1" offset="0%" stop-color="#fff" />
                  <stop id="innerStop2" offset="100%" stop-color="#fff" />
                </linearGradient>
              </defs>

              {/* Outer rect uses outerGrad */}
              <rect
                id="outerCircle"
                x={1.26289}
                y={107.737}
                width={106.474}
                height={106.474}
                rx={53.2371}
                transform="rotate(-90 1.26289 107.737)"
                stroke="url(#outerGrad)" // gradient stroke here
                strokeWidth={1.47423}
              />

              {/* Inner rect uses innerGrad */}
              <rect
                id="innerCircle"
                x={7.26289}
                y={101.737}
                width={94.4742}
                height={94.4742}
                rx={47.2371}
                transform="rotate(-90 7.26289 101.737)"
                stroke="url(#innerGrad)" // gradient stroke here
                strokeWidth={1.47423}
              />
            </svg>

            <div className="absolute -top-23 left-1/2 -translate-x-1/2 p-2 ">
              <svg
                id="vibration"
                width={44}
                height={42}
                viewBox="0 0 44 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="astrc opacity-0"
              >
                <path
                  d="M12.2725 41.7266L5.86354 36.9539L17.8633 23.0451L0 18.8179L2.4545 10.9089L19.3633 18.1361L17.727 0H25.9087L24.4087 18.1361L41.3175 10.9089L43.6356 18.8179L25.9087 23.0451L37.9084 36.9539L31.4995 41.7266L21.8178 25.9087L12.2725 41.7266Z"
                  fill="url(#paint0_linear_158_23254)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_158_23254"
                    x1={21.8178}
                    y1={0}
                    x2={21.8178}
                    y2={41.7266}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop id="astrc-stop1" stopColor="white" />
                    <stop id="astrc-stop2" offset={1} stopColor="#999999" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
              <svg
                id="glowCircle"
                width={237}
                height={237}
                viewBox="0 0 237 237"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-0"
              >
                <g filter="url(#filter0_f_158_25104)">
                  <rect
                    x={64.5}
                    y={172.5}
                    width={108}
                    height={108}
                    rx={54}
                    transform="rotate(-90 64.5 172.5)"
                    stroke="url(#grad1)" // yahan gradient use kiya hai
                    strokeWidth={3}
                    strokeOpacity={1} // opacity 1 kiya for visible gradient
                    fill="none"
                  />
                </g>
                <defs>
                  {/* Linear Gradient define karo */}
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0D1218" />
                    <stop offset="100%" stopColor="#0D1218" />
                  </linearGradient>

                  <filter
                    id="filter0_f_158_25104"
                    x={0.4}
                    y={0.4}
                    width={236.2}
                    height={236.2}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="BackgroundImageFix"
                      result="shape"
                    />
                    <feGaussianBlur
                      stdDeviation={31.3}
                      result="effect1_foregroundBlur_158_25104"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
          </div>
        ))}
      </div>

      <h1
        className=" bottom-text hanken-font text-7xl bold capitalize text-center opacity-0 translate-y-[51vh]"
        style={{
          background: "linear-gradient(to top, #FFFFFF 0%, #828282 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        yours alone
      </h1>

      <h1
        className=" top-text-2 hanken-font  text-7xl bold capitalize text-center opacity-0 -translate-y-[8vh]"
        style={{
          background: "linear-gradient(to top, #FFFFFF 0%, #828282 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        No one can access it
      </h1>
      <h1
        className="bottom-text-2  hanken-font  text-7xl bold capitalize text-center opacity-0 translate-y-76"
        style={{
          background: "linear-gradient(to top, #FFFFFF 0%, #828282 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Except You
      </h1>
      <div className="blank-page bg-[#0D1218] w-full h-[20vh]"></div>
    </div>
  );
};

export default SecureAnimation;
