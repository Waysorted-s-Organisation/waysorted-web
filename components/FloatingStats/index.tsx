import { useRef, useEffect } from "react";
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

  useEffect(() => {
    const cards = gsap.utils.toArray<HTMLElement>(".floating-card");

    // Ensure the cards start small/transparent
    gsap.set(cards, { opacity: 0, scale: 0.75, transformOrigin: "50% 50%" });

    // Use a fromTo tween controlled by ScrollTrigger with a defined start/end
    // and scrub so the animation progress is tied to scroll. This guarantees:
    // - It animates in while scrolling down between start and end,
    // - Animates back to the initial state when scrolling up,
    // - And will animate again each time you scroll into the range.
    const tween = gsap.fromTo(
      cards,
      { opacity: 0, scale: 0.75 },
      {
        opacity: 1,
        scale: 1,
        rotate: 0.5,
        duration: 1.2,
        ease: "back.out(1.7)",
        stagger: 0.18,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 40%",   // when the top of the section hits 60% of viewport
          end: "bottom 40%",  // until the bottom of the section hits 30% of viewport
          scrub: 0.45,        // tie progress to scroll (smooth with a small lag)
          invalidateOnRefresh: true,
          // markers: true,   // uncomment to debug start/end during dev
        },
      }
    );

    return () => {
      // cleanup tween and its ScrollTrigger
      try {
        tween.scrollTrigger?.kill();
      } catch {}
      tween.kill();
    };
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

          <p className="text-secondary-db-60 text-lg mt-6 max-w-[600px]">
            That’s why we’re building <strong>Way</strong> — because productivity
            deserves faster execution than endless searching.
          </p>
        </div>

        {/* Floating cards */}
        <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
          <div className="relative w-full h-full">
            <div className="floating-card absolute top-20 -left-16 rotate-[-6deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#FFB800] text-white rounded-[14px] p-4 shadow-2xl h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  The UI feels <span className="bg-black text-white px-1 rounded-sm">clunky</span>, breaks my workflow every time I switch between tools.
                </p>
                <div>
                  <p className="mt-2 text-xs text-white/90">@designmate22</p>
                  <p className="text-[11px] text-white/70">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute top-1 right-3/5 -translate-x-1/2 rotate-[3deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#32A8FF] text-white rounded-[14px] p-4 shadow-2xl h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  The plugin <span className="bg-black text-white px-1 rounded-sm">slows down</span> my Figma, and my client thinks I’m the bug.
                </p>
                <div>
                  <p className="mt-2 text-xs text-white/90">@lagginglegend</p>
                  <p className="text-[11px] text-white/70">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute top-20 right-40 rotate-[-4deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#8B3DFF] text-white rounded-[14px] p-4 shadow-2xl h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  I <span className="bg-black text-white px-1 rounded-sm">keep switching</span> between tools trying to find the one.
                </p>
                <div>
                  <p className="mt-2 text-xs text-white/90">@designmate22</p>
                  <p className="text-[11px] text-white/70">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute bottom-6 left-9/10 rotate-[5deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#007BFF] text-white rounded-[14px] p-4 shadow-2xl h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white text-lg">
                  The <span className="bg-black text-white px-1 rounded-sm">high pricing</span> of tools isn&apos;t justified, my wallet needs therapy after every subscription.
                </p>
                <div>
                  <p className="mt-2 text-xs text-white/90">@brokeandbold</p>
                  <p className="text-[11px] text-white/70">Figma User</p>
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