"use client";
import clsx from "clsx";
import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Focus({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".scroll-card");
      gsap.set(cards, { scale: 0.9, opacity: 0.7 });

      ScrollTrigger.batch(cards, {
        scroller: containerRef.current!,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: (batch) =>
          gsap.to(batch, { scale: 1, opacity: 1, duration: 0.3, stagger: 0.05, overwrite: "auto" }),
        onLeave: (batch) =>
          gsap.to(batch, { scale: 0.9, opacity: 0.7, duration: 0.3, overwrite: "auto" }),
        onEnterBack: (batch) =>
          gsap.to(batch, { scale: 1, opacity: 1, duration: 0.3, stagger: 0.05, overwrite: "auto" }),
        onLeaveBack: (batch) =>
          gsap.to(batch, { scale: 0.9, opacity: 0.7, duration: 0.3, overwrite: "auto" }),
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className={clsx(
        "rounded-2xl shadow border border-gray-100 text-center flex flex-col",
        "w-full", // mobile
        className // add md sizes from parent
      )}
    >
      {/* Scrollable list tuned so total height ≈ 420px */}
      <div
        ref={containerRef}
        className="relative h-[370px] p-4 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        <div className="pointer-events-none absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/90 via-white/40 to-transparent z-10" />
        <div className="flex-1 space-y-4 py-3">
          {[
            "PDF Exporter Pro",
            "Unit Converter",
            "Color Palettable",
            "Quick Notes",
            "AI Assistant",
            "PDF Exporter Pro",
            "Unit Converter",
            "Color Palettable",
            "Quick Notes",
            "AI Assistant",
          ].map((title, i) => (
            <div key={i} className="scroll-card snap-center bg-white rounded-xl shadow p-4 will-change-transform">
              <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
              <p className="text-gray-600 text-xs">Lorem ipsum dolor sit amet.</p>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white/90 via-white/40 to-transparent z-10" />
      </div>

      <div className="bg-white mt-3 flex flex-col items-start rounded-xl">
        <p className="text-gray-600 text-sm leading-snug mt-2 p-4">
          All the tools you need in one place.
        </p>
      </div>
    </div>
  );
}