"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function VisionSection() {
  const wordsRefs = useRef<HTMLSpanElement[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);

  const VISION_STATEMENT =
    "Our Vision is to create a world where designers can focus entirely on their ideas—without losing time, energy, or creativity to tool chaos";

  const COLOR_INDEX_MAP: Record<number, string> = {
    0: "text-primary-way-100", // "Our"
    1: "text-primary-way-100", // "Vision"
    2: "text-primary-way-100", // "is"
    3: "text-primary-way-100", // "to"
    19: "text-primary-way-100", // "creativity"
    20: "text-primary-way-100", // "to"
    21: "text-primary-way-100", // "tool"
    22: "text-primary-way-100", // "chaos."
  };

  useEffect(() => {
    if (!sectionRef.current || wordsRefs.current.length === 0) return;

    const masterTimeline = gsap.timeline();
    gsap.set(wordsRefs.current, {
      opacity: 0,
    });

    masterTimeline.to(wordsRefs.current, {
      opacity: 0.2,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
    })
    .to(wordsRefs.current, {
      opacity: 1,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
    }, 0.5);


    // ScrollTrigger animation
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 50%",
      end: "bottom 60%",
      animation: masterTimeline,
      scrub: 3,
      pin: false,
      markers: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      masterTimeline.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-white text-center px-6 md:px-20 lg:px-32 py-35"
    >
      {/* Label */}
      <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-6">
        <Image
          src="/icons/mission.svg"
          alt="Our Mission"
          width={30}
          height={30}
          className="block p-1"
        />
        <span className="pl-1 pr-2 py-1 text-secondary-db-100">
          Our Mission & Vision
        </span>
      </span>

      {/* Vision Statement */}
      <p className="text-4xl font-medium pb-40 text-secondary-db-100 leading-relaxed max-w-4xl mx-auto">
        {VISION_STATEMENT.split(" ").map((word, index) => (
          <span
            key={`word-${index}`}
            ref={(el) => {
              if (el) wordsRefs.current[index] = el;
            }}
            className={`inline-block mr-2 ${
              COLOR_INDEX_MAP[index] || ""
            }`}
          >
            {word}
          </span>
        ))}
      </p>
    </section>
  );
}
