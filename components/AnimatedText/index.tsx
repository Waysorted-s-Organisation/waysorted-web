"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function VisionSection() {
  const wordsRefs = useRef<HTMLSpanElement[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);

  const VISION_STATEMENT =
    "Experience seamless integration and super-fast performance. Your data is always secure, while a personalized toolkit adapts precisely to your team's unique needs.";

  const COLOR_INDEX_MAP: Record<number, string> = {
    1: "text-cyan-500", // "seamless"
    4: "text-tertiary-orange-500", // "super-fast"
    10: "text-tertiary-green-500", // "secure"
    13: "text-violet-500", // "personalized"
  };

  useEffect(() => {
    if (!sectionRef.current || wordsRefs.current.length === 0) return;

    const masterTimeline = gsap.timeline();
    gsap.set(wordsRefs.current, {
      opacity: 0.2,
    });

    masterTimeline.to(wordsRefs.current, {
      opacity: 1,
      duration: 2,
      stagger: 0.15,
      ease: "power3.out",
    });

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
      {/* Vision Statement */}
      <p className="text-4xl font-medium text-secondary-db-100 leading-relaxed max-w-4xl mx-auto">
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
