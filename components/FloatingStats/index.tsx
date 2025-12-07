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

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".floating-card");
      if (!cards.length) return;

      // const initialRotations = cards.map(
      //   (card) => Number(gsap.getProperty(card, "rotation")) || 0
      // );

      mm.add(
        {
          isMobile: "(max-width: 767px)",
          isDesktop: "(min-width: 768px)",
        },
        (ctx) => {
          const { isMobile } = ctx.conditions ?? {};

          const resetMobileState = () => {
            if (!isMobile) return;
            cards.forEach((card) => {
              gsap.set(card, {
                opacity: 0,
                scale: 0.95,
                y: 70,
                // rotation: initialRotations[i],
              });
            });
          };

          gsap.set(cards, { clearProps: "all" });

          cards.forEach((card, i) => {
            gsap.set(card, {
              opacity: 0,
              scale: isMobile ? 0.95 : 0.75,
              y: isMobile ? 70 : 40,
              rotation: i % 2 ? 10 : -10,
              transformOrigin: "50% 50%",
            });
          });

          if (isMobile) {
            const mobileSize = 151;
            const mobilePositions = [
              { top: "-50%", left: "6%", rotation: -13 },
              { top: "-18%", left: "45%", rotation: 6 },
              { top: "40%", left: "10%", rotation: 1 },
              { top: "70%", left: "46%", rotation: 6 },
            ];
            cards.forEach((card, i) => {
              const pos = mobilePositions[i] ?? {};
              gsap.set(card, {
                width: `${mobileSize}px`,
                height: `${mobileSize}px`,
                ...pos,
              });
            });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: isMobile ? "top -25%" : "top top",
              end: isMobile ? "+=200%" : "+=200%",
              pin: true,
              pinSpacing: true,
              scrub: true, // bidirectional
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                // When scrolled back above the start, hide cards on mobile
                if (isMobile && self.progress <= 0.0001) {
                  resetMobileState();
                }
              },
              // markers: true,
            },
          });

          // Stage 1: headline breathing room
          tl.to({}, { duration: isMobile ? 0.6 : 0.9 });

          // Stage 2: cards in
          tl.to(cards, {
            opacity: 1,
            scale: 1,
            y: 0,
            // rotation: (i) =>
            //   isMobile? initialRotations[i] * 0.5 : initialRotations[i] * 0.85,
            ease: "power2.out",
            stagger: isMobile ? 0.35 : 0.5,
            duration: isMobile ? 0.9 : 1.2,
            immediateRender: false,
          });

          // Stage 3: gentle hold
          tl.to({}, { duration: isMobile ? 0.5 : 0.8 });
        }
      );

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => {
      ctx.revert();
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[150vh] md:min-h-screen bg-float-dots text-center flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative max-w-5xl w-full mx-auto flex flex-col items-center">
        {/* Main content */}
        <div className="w-full flex flex-col items-center z-10 px-4">
          <p className="relative text-secondary-db-80 font-normal text-3xl md:text-6xl leading-tight w-[243px] md:w-[820px] max-w-none">
            10k+ tools, yet creators keep{" "}
            <span className="relative inline-block">
              <span className="opacity-0 px-4 py-1 rounded-full">Searching</span>
              <span className="absolute inset-0 bg-secondary-db-90 text-white rounded-full px-4 py-1">
                {typedText}
              </span>
            </span>
          </p>

          <p className="text-secondary-db-60 text-lg md:text-2xl font-medium mt-6 md:w-[500px] w-[340px] max-w-none translate-y-50 md:translate-y-0">
            <span className="text-secondary-db-90">That&apos;s why we&apos;re building Way,</span> Because productivity
            deserves faster execution than endless searching.
          </p>
        </div>

        {/* Floating cards */}
        <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
          <div className="relative w-full h-full">
            <div className="floating-card absolute top-20 -left-16 rotate-[16deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#FFAA00] text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white md:text-lg text-xs">
                  The UI feels <span className="bg-secondary-db-100 text-white px-1 rounded-sm">clunky</span>, breaks my workflow every time I switch between tools.
                </p>
                <div className="text-start">
                  <p className="mt-2 md:text-xs text-[10px] text-primary-way-5">@designmate22</p>
                  <p className="md:text-[10px] text-[8px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute top-1 right-3/5 -translate-x-1/2 rotate-[3deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-tertiary-cyan-500 text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white md:text-lg text-xs">
                  The plugin <span className="bg-secondary-db-100 text-white px-1 rounded-sm">slows down</span> my Figma, and my client thinks I’m the bug.
                </p>
                <div className="text-start">
                  <p className="mt-2 md:text-xs text-[10px] text-primary-way-5">@lagginglegend</p>
                  <p className="md:text-[10px] text-[8px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute top-20 right-40 rotate-[-4deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-[#9000FF] text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white md:text-lg text-xs">
                  I <span className="bg-secondary-db-100 text-white px-1 rounded-sm">keep switching</span> between tools trying to find the one.
                </p>
                <div className="text-start">
                  <p className="mt-2 md:text-xs text-[10px] text-primary-way-5">@designmate22</p>
                  <p className="md:text-[10px] text-[8px] text-primary-way-5">Figma User</p>
                </div>
              </div>
            </div>

            <div className="floating-card absolute bottom-6 left-9/10 rotate-[5deg] w-[200px] h-[200px] opacity-0 scale-[0.75] z-20">
              <div className="card-inner pointer-events-auto bg-tertiary-blue-500 text-white rounded-[10px] p-4 h-full flex flex-col justify-between">
                <p className="font-semibold leading-snug text-white md:text-lg text-xs">
                  The <span className="bg-secondary-db-100 text-white px-1 rounded-sm">high pricing</span> of tools isn&apos;t justified, my wallet needs therapy after every subscription.
                </p>
                <div className="text-start">
                  <p className="mt-2 md:text-xs text-[10px] text-primary-way-5">@brokeandbold</p>
                  <p className="md:text-[10px] text-[8px] text-primary-way-5">Figma User</p>
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