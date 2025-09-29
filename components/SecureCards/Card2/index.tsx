import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Base1 from "../Base1";
import Image from "next/image";

const Card2 = () => {
  const keyDrop = useRef<HTMLDivElement | null>(null);

  // Key falling + opacity animations
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDefault: "(max-width: 1279px)", // default screen
          xl: "(min-width: 1280px)", // Tailwind xl breakpoint
        },
        (context) => {
          const { isDefault, xl } = context.conditions as {
            isDefault: boolean;
            xl: boolean;
          };

          // Falling animation for all `.falling` keys
          if (keyDrop.current) {
            const elements = keyDrop.current.querySelectorAll(".falling");
            gsap.to(elements, {
              y: "100%",
              duration: 6,
              repeat: -1,
              ease: "linear",
            });
          }

          // Default screen opacity animations
          if (isDefault) {
            gsap.to(".key1", {
              // keyframes: {
              //   "0%": { opacity: 1 },
              //   "40%": { opacity: 0 },
              //   "100%": { opacity: 1 },
              // },
              duration: 6,
              repeat: -1,
              ease: "linear",
              opacity: 1,
            });
            gsap.to(".key2", {
              keyframes: {
                "0%": { opacity: 1 },
                "46%": { opacity: 0 },
                "88%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
              duration: 6,
              repeat: -1,
              ease: "linear",
            });
            gsap.to(".key3", {
              keyframes: {
                "0%": { opacity: 1 },
                "15%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
              duration: 6,
              repeat: -1,
              ease: "linear",
            });
            gsap.to(".key4", {
              keyframes: {
                "0%": { opacity: 0 },
                "10%": { opacity: 1 },
                "90%": { opacity: 1 },
                "100%": { opacity: 0 },
              },
              duration: 6,
              repeat: -1,
              ease: "linear",
            });
          }

          // XL screen opacity animations
          if (xl) {
            gsap.to(".key1", {
              keyframes: {
                "8%": { opacity: 0 },
                "50%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
              duration: 6,
              repeat: -1,
              ease: "linear",
            });

            gsap.to(".key3", {
              keyframes: {
                "0%": { opacity: 1 },
                "55%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
              duration: 6,
              repeat: -1,
              ease: "linear",
            });
            gsap.to(".key4", {
              keyframes: {
                "0%": { opacity: 0 },
                "15%": { opacity: 1 },
                "90%": { opacity: 0 },
                "100%": { opacity: 0 },
              },
              duration: 6,
              repeat: -1,
              ease: "linear",
            });
          }
        }
      );
    },
    { scope: keyDrop }
  );

  // Strip and star animations
  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1 });

    tl.fromTo(
      ".strip",
      { y: 20, x: -150 }, // Start at bottom
      {
        y: 0, // Move up
        duration: 2.5,
        ease: "linear",
      }
    )
      // .to(".stars", {
      //   opacity: 1,
      //   duration: 0.1,
      //   stagger: 0.2,
      // })
      // .to(".stars", {
      //   opacity: 1,
      //   duration: 0.1,
      // })
      // .to(".stars", {
      //   opacity: 0,
      //   duration: 0.1,
      //   stagger: 0.1,
      // })
      .set(".strip", { y: -10, x: -80 }) // Instantly reset to bottom
      .to({}, { duration: 0.5 }); // Optional delay before next cycle
  });

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-t from-[#525252] to-[#2A2E34]  rounded-lg shadow-md"
      style={{
        width: "402.06px",
        height: "199.17px",
      }}
    >
      <div ref={keyDrop} className="relative w-full h-full overflow-hidden">
        {/* Left falling key */}
        <div className=" key1 falling absolute rotate-80 left-[4%] top-[10%] transform h-full w-[15%] xl:w-[12%] bg-[url('/icons/security-key.svg')] bg-contain bg-no-repeat bg-center"></div>
        {/* Center main key with strips */}
        <div className="  security-key overflow-hidden relative left-1/2 top-[-15%] transform -translate-x-1/2 h-full w-[35%] bg-[url('/icons/security-key.svg')] bg-no-repeat bg-center ">
          <Image
            src="/icons/two-strip.svg"
            alt="short-strip"
            width={100}
            height={150}
            className="strip absolute -bottom-[10px] left-[-40px]"
          />
        </div>
        {/* Stars in center */}
        <div className="absolute left-1/2 top-[-110%] transform -translate-x-1/2 w-[35%]">
          <Image
            src="/icons/star.svg"
            alt="star"
            width={12}
            height={12}
            className="stars absolute top-[49%] left-[49%] opacity-0 scale-75"
          />
          <Image
            src="/icons/star.svg"
            alt="star"
            width={14}
            height={14}
            className="stars absolute top-[39%] left-[20%] opacity-0"
          />
          <Image
            src="/icons/star.svg"
            alt="star"
            width={14}
            height={14}
            className="stars absolute top-[62%] left-[14%] opacity-0"
          />
          <Image
            src="/icons/star.svg"
            alt="star"
            width={10}
            height={10}
            className="stars absolute top-[34%] left-[84%] opacity-0 scale-50"
          />
        </div>
        {/* Right falling keys */}
        <div className="key3 falling absolute rotate-160 left-[85%] top-[-10%] bg-[0.3] transform h-full w-[12%] xl:w-[10%] bg-[url('/icons/security-key.svg')] bg-contain bg-no-repeat bg-center"></div>
        <div className="key4 falling absolute rotate-240 left-[70%] top-[-68%] transform h-full w-[18%] xl:w-[13%] bg-[url('/icons/security-key.svg')] bg-contain bg-no-repeat bg-center"></div>
        {/* Additional falling keys */}
        <div className=" falling absolute rotate-80 left-[4%] top-[-90%] transform h-full w-[15%] xl:w-[12%] bg-[url('/icons/security-key.svg')] bg-contain bg-no-repeat bg-center "></div>{" "}
        <div className=" falling absolute rotate-160 left-[85%] top-[-110%] bg-[0.3] transform h-full w-[12%] xl:w-[10%] bg-[url('/icons/security-key.svg')] bg-contain bg-no-repeat bg-center "></div>{" "}
        <div className=" falling absolute rotate-240 left-[70%] top-[-168%] transform h-full w-[18%] xl:w-[13%] bg-[url('/icons/security-key.svg')] bg-contain bg-no-repeat bg-center "></div>
        {/* Base content */}
        <Base1
          title="Trusted Keys"
          content="Fusce vehicula rutrum lectus, ut posuere libero  sodales at. Praesent erat quam,"
          libero="pr-30"
        />
      </div>
    </div>
  );
};

export default Card2;
