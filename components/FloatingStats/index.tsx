import { useRef, useLayoutEffect } from "react";
import { useTypewriter } from "@/hooks/useTypeWriter";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FloatingStatsSection = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const typedText = useTypewriter(
    ["Searching", "Switching", "Hunting"],
    120,
    60,
    1500
  );

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".floating-card");

      // Capture initial rotations (from Tailwind rotate-* classes) without altering them
      const initialRotations = cards.map(
        (card) => Number(gsap.getProperty(card, "rotation")) || 0
      );

      // Initial hidden state (don’t touch rotation so design look stays)
      cards.forEach((cards, i) => {
        gsap.set(cards, {
          opacity: 0,
          scale: 0.75,
          y: 40,
          rotate: i%2?10:-10,
          transformOrigin: "50% 50%"
        });
      });

      // Pinned timeline: Stage 1 hold (text only), then Stage 2 cards appear
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%",       // Adjust for longer/shorter scroll experience
          pin: true,
          scrub: true,
          anticipatePin: 1
          // markers: true,
        }
      });

      // Stage 1 breathing space (nothing animates yet)
      tl.to({}, { duration: 0.9 });

      // Stage 2 card entrance
      tl.to(cards, {
        opacity: 1,
        scale: 1,
        y: 0,
        rotation: (i) => initialRotations[i] * 0.85, // returns number (TS-safe)
        ease: "power2.out",
        stagger: 0.5,
        duration: 1.4
      });

      // Gentle hold after cards are in
      tl.to({}, { duration: 0.8 });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen bg-float-dots text-center flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative max-w-5xl w-full mx-auto flex flex-col items-center">
        {/* Main content */}
        <div className="w-full flex flex-col items-center z-10">
          <p className="relative text-secondary-db-80 font-normal text-3xl md:text-6xl leading-tight max-w-[820px]">
            10k+ tools, yet creators keep{" "}
            <span className="relative inline-block">
              <span className="opacity-0 px-4 py-1 rounded-full">Searching</span>
              <span className="absolute inset-0 bg-secondary-db-90 text-white rounded-full px-4 py-1">
                {typedText}
              </span>
            </span>
          </p>

          <p className="text-secondary-db-60 text-lg font-medium mt-6 text-2xl max-w-[500px]">
            <span className="text-secondary-db-90">That’s why we’re building Way,</span> Because productivity
            deserves faster execution than endless searching.
          </p>
        </div>

        {/* Floating cards */}
        <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
          <div className="relative w-full h-full">
            <div className="floating-card absolute top-20 -left-16 rotate-[-6deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#FFAA00] text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  The UI feels <span className="bg-secondary-db-100 text-white px-1 rounded-sm">clunky</span>, breaks my workflow every time I switch between tools.
                </p>
                <div className="text-start">
                  <p className="mt-2 text-xs text-primary-way-5">@designmate22</p>
                  <p className="text-[10px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute top-1 right-3/5 -translate-x-1/2 rotate-[3deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-tertiary-cyan-500 text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  The plugin <span className="bg-secondary-db-100 text-white px-1 rounded-sm">slows down</span> my Figma, and my client thinks I’m the bug.
                </p>
                <div className="text-start">
                  <p className="mt-2 text-xs text-primary-way-5">@lagginglegend</p>
                  <p className="text-[10px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute top-20 right-40 rotate-[-4deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#9000FF] text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  I <span className="bg-secondary-db-100 text-white px-1 rounded-sm">keep switching</span> between tools trying to find the one.
                </p>
                <div className="text-start">
                  <p className="mt-2 text-xs text-primary-way-5">@designmate22</p>
                  <p className="text-[10px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute bottom-6 left-9/10 rotate-[5deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-tertiary-blue-500 text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  The <span className="bg-secondary-db-100 text-white px-1 rounded-sm">high pricing</span> of tools isn&apos;t justified, my wallet needs therapy after every subscription.
                </p>
                <div className="text-start">
                  <p className="mt-2 text-xs text-primary-way-5">@brokeandbold</p>
                  <p className="text-[10px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FloatingStatsSection;