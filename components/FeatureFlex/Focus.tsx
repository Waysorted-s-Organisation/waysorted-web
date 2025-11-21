"use client";
import clsx from "clsx";
import { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ITool } from "@/models/tool";
import Image from "next/image";

export default function Focus({ className }: { className?: string }) {
  const [tools, setTools] = useState<ITool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tools/active", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setTools(json.data ?? []);
      } catch (e) {
        if (!cancelled) setError("Failed to load tools");
        console.error("Footer tools fetch error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // GSAP logic preserved exactly (unchanged)
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
          gsap.to(batch, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            overwrite: "auto",
          }),
        onLeave: (batch) =>
          gsap.to(batch, {
            scale: 0.9,
            opacity: 0.7,
            duration: 0.3,
            overwrite: "auto",
          }),
        onEnterBack: (batch) =>
          gsap.to(batch, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            overwrite: "auto",
          }),
        onLeaveBack: (batch) =>
          gsap.to(batch, {
            scale: 0.9,
            opacity: 0.7,
            duration: 0.3,
            overwrite: "auto",
          }),
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const skeletonCount = 5;

  return (
    <div
      className={clsx(
        "rounded-2xl shadow-sm border border-gray-100 bg-white flex flex-col",
        "w-full",
        className
      )}
    >
      {/* Scrollable list */}
      <div
        ref={containerRef}
        className="relative h-[370px] p-4 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {/* Top gradient overlay */}
        <div className="pointer-events-none absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white via-white/60 to-transparent z-10" />

        <ul className="space-y-3 py-2">
          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <li
                key={`skeleton-${i}`}
                className="scroll-card snap-center rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm animate-pulse"
              >
                <div className="w-12 h-12 rounded-md bg-indigo-50 ring-1 ring-indigo-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-gray-200" />
                  <div className="h-2.5 w-3/4 rounded bg-gray-200" />
                </div>
              </li>
            ))}

          {!loading && error && (
            <li className="text-sm text-red-600 px-2 py-1">{error}</li>
          )}

          {!loading && !error && tools.length === 0 && (
            <li className="text-sm text-gray-500 px-2 py-1">
              No tools available right now.
            </li>
          )}

          {!loading &&
            !error &&
            tools.map((tool, i) => (
              <li
                key={tool.name + i}
                className={clsx(
                  "scroll-card snap-center group flex items-center gap-3",
                  "rounded-lg border border-gray-200 bg-white px-4 py-3"
                )}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-md bg-primary-way-10"
                >
                  <Image
                    src={tool.iconData || "/icons/tool-fallback.svg"}
                    width={36}
                    height={36}
                    alt={`${tool.name} icon`}
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-medium text-secondary-db-100 text-sm text-start truncate"
                  >
                    {tool.name}
                  </h4>
                  {tool.shortDescription && (
                    <p className="text-xs text-secondary-db-70 text-start line-clamp-2">
                      {tool.shortDescription}
                    </p>
                  )}
                </div>
              </li>
            ))}
        </ul>

        {/* Bottom gradient overlay */}
      </div>

      <div className="bg-white mt-3 flex flex-col items-start rounded-xl">
        <p className="text-gray-600 text-sm leading-snug mt-2 px-4 pb-4">
          All the tools you need in one place.
        </p>
      </div>
    </div>
  );
}