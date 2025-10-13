"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const icons = [
  { src: "/icons/image1.svg", alt: "CleanShot" },
  { src: "/icons/image3.svg", alt: "Reeder" },
  { src: "/icons/image2.svg", alt: "Mosaic" },
  { src: "/icons/image4.svg", alt: "DomainLore" },
];

const HEADLINE =
  "Experience seamless integration and super-fast performance. Your data is always secure, while a personalized toolkit adapts precisely to your team's unique needs.";

const COLOR_INDEX_MAP: Record<number, string> = {
  1: "text-cyan-500", // "seamless"
  4: "text-tertiary-orange-500", // "super-fast"
  10: "text-tertiary-green-500", // "secure"
  13: "text-violet-500", // "personalized"
};

export default function ToolsGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const iconsContainerRef = useRef<HTMLDivElement>(null);
  const iconsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordsRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const transformRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    const iconsContainer = iconsContainerRef.current;

    if (!section || !iconsContainer) return;

    const iconsEls = iconsRefs.current.filter(Boolean) as HTMLDivElement[];
    const wordsEls = wordsRefs.current.filter(Boolean) as HTMLSpanElement[];
    const transformEl = transformRef.current;

    if (iconsEls.length === 0) return;

    const heroContent = document.getElementById("hero-content");

    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    // Master timeline with longer duration
    const masterTimeline = gsap.timeline({ paused: true });

    // Initial states
    gsap.set(iconsEls, {
      scale: 1,
      rotation: 0,
      transformOrigin: "center center",
    });

    gsap.set(wordsEls, {
      opacity: 0,
      y: 0,
    });

    gsap.set(transformEl, {
      // ✅ Hide "Transform your workflow" initially
      opacity: 0,
      y: 0,
      scale: 0.95,
    });

    // Phase 1: move icons up to center (20% of timeline)
    const moveUpPhase = gsap.timeline();

    if (heroContent) {
      moveUpPhase.to(
        heroContent,
        {
          y: -50,
          opacity: 0,
          duration: 1.5,
          ease: "power3.inOut",
        },
        0
      );
    }

    moveUpPhase.to(
      iconsEls,
      {
        yPercent: -50,
        duration: 2,
        ease: "power2.out",
      },
      0
    );

    masterTimeline.add(moveUpPhase);

    // Phase 2: scatter icons to fixed positions (40% of timeline)
    // Using fixed relative positions instead of dynamic calculations
    const scatterPositions = [
      { x: -300, y: -200 }, // top-left
      { x: -500, y: 200 }, // bottom-left
      { x: 500, y: -200 }, // top-right
      { x: 300, y: 200 }, // bottom-right
    ];

    masterTimeline.to(
      iconsEls,
      {
        x: (i) => scatterPositions[i % 4].x,
        y: (i) => scatterPositions[i % 4].y,
        scale: 0.6,
        rotation: (i) => (i % 2 === 0 ? -15 : 15),
        duration: 3,
        ease: "power2.inOut",
        stagger: 0.2,
      },
      "+=1" // Add delay between phases
    );
    masterTimeline.to(
      transformEl,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: "power3.out",
      },
      "+=0.5" // Slight delay after icons scatter
    );

    // Phase 3: reveal text word-by-word (40% of timeline)
    const wordsTimeline = gsap.timeline({ delay: 0.5 }); // 0.5s initial pause

    wordsTimeline.to(wordsEls, {
      opacity: 0.2,
      duration: 2,
      stagger: 0.15,
      ease: "power3.out",
    }, 0); // start at time 0 of this nested timeline

    wordsTimeline.to(wordsEls, {
      opacity: 1,
      duration: 2,
      stagger: 0.15,
      ease: "power3.out",
    }, 1); // start at the same time as previous tween

    masterTimeline.add(wordsTimeline); 

    // ScrollTrigger with much slower scrub
    const scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      animation: masterTimeline,
      scrub: 4, // Slower scrub (higher number = slower)
      pin: true,
      markers: false,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });

    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      scrollTrigger.kill();
      masterTimeline.kill();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative max-w-7xl mx-auto"
      style={{ minHeight: "50vh" }}
    >
      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Icons row */}
        <div
          ref={iconsContainerRef}
          className="flex items-center justify-center gap-8 relative"
        >
          {icons.map((icon, index) => (
            <div
              key={index}
              ref={(el) => {
                iconsRefs.current[index] = el;
              }}
              className="bg-transparent flex items-center justify-center"
            >
              <Image
                src={icon.src}
                alt={icon.alt}
                width={120}
                height={120}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          ))}
        </div>

        {/* Headline overlay */}
        <div className="absolute translate-x-[10%] translate-y-[-150%] flex flex-col items-center justify-center pointer-events-none">
          <div
            className="font-medium text-secondary-db-100 text-3xl mb-8"
            ref={transformRef}
          >
            <span>Transform your</span>
            <span
              className="relative shadow-color z-0 inline-flex after:absolute after:left-[0.04em] after:top-[0.04em] after:content-[attr(data-text)] after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)] after:-z-10 after:bg-[length:0.06em_0.06em] after:bg-clip-text after:text-transparent after:animate-line-shadow italic tracking-tighter font-bold"
              data-text="workflow"
            >
              workflow
            </span>
          </div>
          <h2 className="text-center leading-snug font-semibold max-w-5xl px-12 text-4xl">
            {HEADLINE.split(" ").map((word, index) => (
              <span
                key={`word-${index}`}
                ref={(el) => {
                  wordsRefs.current[index] = el;
                }}
                className={`inline-block mr-2 ${COLOR_INDEX_MAP[index] || ""}`}
              >
                {word}
              </span>
            ))}
          </h2>
        </div>
      </div>
    </section>
  );
}
