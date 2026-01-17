"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


type ContentItem =
  | { type: "text"; value: string }
  | { type: "icon"; src: string; alt: string; width: number; height: number; className?: string };

const CONTENT_ITEMS: ContentItem[] = [
  { type: "text", value: "Waysorted" },
  { type: "text", value: "is" },
  { type: "text", value: "empowering" },
  { type: "text", value: "creators" },
  { type: "icon", src: "/icons/team-1.svg", alt: "Creators", width: 32, height: 32 },
  { type: "text", value: "worldwide" },
  { type: "icon", src: "/icons/world-1.svg", alt: "Worldwide", width: 32, height: 32 },
  { type: "text", value: "with" },
  { type: "text", value: "accelerated," },
  { type: "text", value: "smart," },
  { type: "text", value: "and" },
  { type: "text", value: "effortless" },
  { type: "text", value: "tools" },
  { type: "text", value: "for" },
  { type: "text", value: "the" },
  { type: "text", value: "next" },
  { type: "text", value: "era" },
  { type: "text", value: "of" },
  { type: "text", value: "design" },
  { type: "text", value: "productivity" },
  { type: "icon", src: "/icons/rocket-2.svg", alt: "Productivity", width: 32, height: 32 },
  { type: "text", value: "." },
];

export default function VisionSection() {
  const elementsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Filter out null refs
    const elements = elementsRef.current.filter(Boolean);
    if (elements.length === 0) return;

    const masterTimeline = gsap.timeline();

    // Initial State
    gsap.set(elements, { opacity: 0, y: 20 });

    // Animation: Fade in words/icons
    masterTimeline.to(elements, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.05,
      ease: "power3.out",
    });

    // Add a dummy tween to create the "pause" at the end
    // The timeline length is extended so scrubbing through it takes longer after the visuals are done
    masterTimeline.to({}, { duration: 1 }); // 1 second "pause" relative to the scrub speed

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 20%",     // Start pinning when section is near top
      end: "+=800",         // Pin for 800px of scroll distance
      animation: masterTimeline,
      scrub: 1,             // Smooth scrubbing
      pin: true,            // Pin the section
      markers: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      masterTimeline.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-white text-center px-6 md:px-20 lg:px-32 pb-40 min-h-[80vh] flex flex-col items-center justify-center pt-24"
    >

      {/* Vision Statement */}
      <p className="text-4xl font-medium text-secondary-db-100 leading-relaxed max-w-3xl mx-auto">
        {CONTENT_ITEMS.map((item, index) => {
          if (item.type === "icon") {
            return (
              <span
                key={`item-${index}`}
                ref={(el) => {
                  elementsRef.current[index] = el;
                }}
                className={`inline-block mx-1 align-middle ${item.className || ""}`}
              >
                <Image
                  src={item.src!}
                  alt={item.alt!}
                  width={item.width}
                  height={item.height}
                  className="w-auto h-8 md:h-10 object-contain"
                />
              </span>
            );
          }
          return (
            <span
              key={`item-${index}`}
              ref={(el) => {
                elementsRef.current[index] = el;
              }}
              className="inline-block mx-1.5"
            >
              {item.value}
            </span>
          );
        })}
      </p>
    </section>
  );
}
