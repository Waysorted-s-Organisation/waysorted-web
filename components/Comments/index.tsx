"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Comments() {
  const wordsRefs = useRef<HTMLSpanElement[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);

  const VISION_STATEMENT =
    "Designers juggle 100+ tools weekly, wasting time switching and searching perfect tools. Waysorted tackle the chaotic workflow...";

  useEffect(() => {
    if (!sectionRef.current || wordsRefs.current.length === 0) return;

    // Reset initial styles for words
    gsap.set(wordsRefs.current, {
      opacity: 0,
    });

    // Create scroll-synced animation
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 50%",      // When animation starts
        end: "bottom 90%",     // When animation ends
        scrub: 1,              // Smooth scrubbing effect
        markers: false,        // Set true if you want to debug
        invalidateOnRefresh: true,
      },
    });

    // Animate words in sequence
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

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      masterTimeline.kill();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="w-full bg-white flex flex-col items-center justify-center text-center py-40"
      >
        <div className="blue-bg-dots rounded-3xl max-w-6xl mx-auto text-white">
          <p className="text-white font-normal text-2xl leading-relaxed py-35 px-35">
            {VISION_STATEMENT.split(" ").map((word, index) => (
              <span
                key={`word-${index}`}
                ref={(el) => {
                  if (el) wordsRefs.current[index] = el;
                }}
                className="inline-block mx-1"
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </section>
    </>
  );
}
