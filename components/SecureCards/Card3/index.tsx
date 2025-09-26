import React from "react";
import Base1 from "../Base1";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const Card3 = () => {
  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1 });

    tl.to(".strip", {
      x: 250,
      y: -80,
      duration: 2,
      ease: "linear",
    })
      .to({}, { duration: 1 }) // delay before reset
      .set(".strip", { x: 0, y: 0 });
  });

  useGSAP(() => {
    gsap.to(".vib-cloud1", {
      x: 22, // move 2px to the right
      duration: 2, // speed of vibration
      ease: "linear", // smooth motion
      yoyo: true, // go back to original position
      repeat: -1, // infinite loop
    });
    gsap.to(".vib-cloud2", {
      x: 82, // move 2px to the right
      duration: 3, // speed of vibration
      ease: "linear", // smooth motion
      yoyo: true, // go back to original position
      repeat: -1, // infinite loop
    });
    gsap.to(".vib-cloud3", {
      x: 36, // move 2px to the right
      duration: 3, // speed of vibration
      ease: "linear", // smooth motion
      yoyo: true, // go back to original position
      repeat: -1, // infinite loop
    });
  });

  return (
    <div
      className=" bg-gradient-to-b from-[#2A2E34] to-[#525252]  relative rounded-xl overflow-hidden "
      style={{ width: "345.29px", height: "241.05px" }}
    >
      <Image
        src="/icons/left-cloud.svg"
        alt=""
        className="vib-cloud1 relative top-20 w-16 "
        width={10}
        height={10}
      />
      <Image
        src="/icons/right-cloud.svg"
        alt=""
        className="vib-cloud2 relative -top-5 left-28 -rotate-360 w-16"
        width={10}
        height={10}
      />
      <Image
        src="/icons/left-cloud.svg"
        alt=""
        className="vib-cloud3 relative -top-6  left-74 w-16"
        width={10}
        height={10}
      />

      <div
        className="masking-cloud absolute  left-50 transform -translate-x-3/4 bg-amber-500 top-21"
        style={{
          width: "126.57px",
          height: "63.5px",
          backgroundImage: "url('/icons/locked-cloud.svg')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <Image
          src="/icons/short-strip.svg"
          alt=""
          width={100}
          height={250}
          className="strip scale-120 absolute bottom-[-30px] left-[-40px] "
        />
        <Image
          src="/icons/large-strip.svg"
          alt=""
          width={125}
          height={350}
          className="strip scale-120 absolute bottom-[-50px] left-[-75px] "
        />
      </div>
      <Base1
        title={"Secure API Access"}
        content={
          "Fusce vehicula rutrum lectus, ut posuere libero sodales at. Praesent erat quam,"
        }
        libero="pr-14"
      />
    </div>
  );
};

export default Card3;
