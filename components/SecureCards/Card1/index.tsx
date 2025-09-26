import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Base1 from "../Base1";

const Card1 = () => {
  const cardsLR = useRef<HTMLDivElement | null>(null);
  const tofro = useRef<HTMLDivElement | null>(null);

  // Background infinite scroll
  useGSAP(
    () => {
      gsap.to(".scroll-bg", {
        x: "100%",
        repeat: -1,
        duration: 6,
        ease: "linear",
        modifiers: {
          xPercent: gsap.utils.wrap(-100, 0),
        },
      });
    },
    { scope: cardsLR }
  );

  // Pendulum swing
  useGSAP(
    () => {
      gsap.to(".pendulum", {
        rotation: 5,
        transformOrigin: "top center",
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut",
      });
    },
    { scope: tofro }
  );

  // Strip and stars animation
  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1 });

    tl.fromTo(
      ".strip",
      { y: 20, x: -150 }, // Start at bottom
      {
        y: 0, // Move up
        duration: 1.5,
        ease: "linear",
      }
    )
      .to(".stars", {
        opacity: 1,
        duration: 0.1,
        stagger: 0.2,
      })
      .to(".stars", {
        opacity: 1,
        duration: 0.1,
      })
      .to(".stars", {
        opacity: 0,
        duration: 0.1,
        stagger: 0.1,
      })
      .set(".strip", { y: -10, x: -80 }) // Instantly reset to bottom
      .to({}, { duration: 0.5 }); // Optional delay before next cycle
  });

  return (
    <div
      ref={cardsLR}
      className="relative overflow-hidden bg-gradient-to-t from-[#8f8f8f] to-[#292929]   rounded-lg shadow-md"
      style={{ width: "289.45px", height: "199.17px" }}
    >
      {/* Moving background */}
      <div className="scroll-bg flex top-0 relative h-[125px] ">
        <div className="absolute left-0  h-full w-full bg-[url('/icons/background-cards.svg')] bg-contain bg-no-repeat bg-center"></div>
        <div className="absolute  left-[-289px] h-full w-full bg-[url('/icons/background-cards.svg')] bg-contain bg-no-repeat bg-center"></div>
      </div>

      {/* Pendulum card */}
      <div
        ref={tofro}
        className="absolute top-0 left-50 transform -translate-x-30   w-full h-full"
      >
        <div
          className="pendulum absolute card-masking top-5"
          style={{
            width: "50%",
            height: "50%",
            backgroundImage: "url('/icons/ID-card.svg')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <Image
            src="/icons/two-strip.svg"
            alt=""
            width={100}
            height={250}
            className="strip  bottom-[-50px] left-[-40px] "
          />
        </div>

        {/* Stars */}
        <div className="absolute w-full h-full pointer-events-none">
          <Image
            src="/icons/star.svg"
            alt="star"
            width={6}
            height={6}
            className="absolute stars  opacity-0 pendulum "
            style={{ top: "20%", left: "15%" }}
          />
          <Image
            src="/icons/star.svg"
            alt="star"
            width={8}
            height={8}
            className="absolute stars opacity-0 pendulum "
            style={{ top: "15%", left: "30%" }}
          />

          <Image
            src="/icons/star.svg"
            alt="star"
            width={4}
            height={4}
            className="absolute stars opacity-0 pendulum "
            style={{ top: "50%", right: "65%" }}
          />
        </div>
      </div>

      {/* Base Content */}
      <Base1
        title={"Permission Control"}
        content={
          "Fusce vehicula rutrum lectus, ut posuere libero sodales at. Praesent erat quam,"
        }
      />
    </div>
  );
};

export default Card1;
