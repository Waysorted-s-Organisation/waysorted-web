"use client";
import clsx from "clsx";
import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { ITool } from "@/models/tool";
import Image from "next/image";

export default function Focus({ className }: { className?: string }) {
  const [tools, setTools] = useState<ITool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLLIElement | null)[]>([]);
  const displayTools = useMemo(() => {
    return tools.length > 0 ? [...tools, ...tools, ...tools] : [];
  }, [tools]);

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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || loading || displayTools.length === 0) return;

    const resetScroll = () => {
      container.scrollTop = container.scrollHeight / 3;
    };

    resetScroll();

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const sectionHeight = scrollHeight / 3;
      const buffer = 50;

      if (scrollTop < buffer) {
        container.scrollTop = scrollTop + sectionHeight;
      }
      else if (scrollTop >= sectionHeight * 2 - buffer) {
        container.scrollTop = scrollTop - sectionHeight;
      }
    };

    container.addEventListener("scroll", handleScroll);

    const updateAnimations = () => {
      if (!container) return;

      const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;
      const activationRange = 120;

      cardsRef.current.forEach((card) => {
        if (!card) return;

        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        const distance = Math.abs(containerCenter - cardCenter);

        let progress = distance / activationRange;
        if (progress > 1) progress = 1;

        const scaleFactor = 1 - progress;

        gsap.set(card, {
          scale: 0.9 + (0.1 * scaleFactor),
          opacity: 0.7 + (0.3 * scaleFactor)
        });
      });
    };

    gsap.ticker.add(updateAnimations);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      gsap.ticker.remove(updateAnimations);
    };
  }, [loading, displayTools]); // Now stable thanks to useMemo

  const skeletonCount = 5;

  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-100 bg-white flex flex-col",
        "w-full",
        className
      )}
    >
      <div
        ref={containerRef}
        className="relative h-[370px] p-4 overflow-y-scroll no-scrollbar"
      >
        <div className="pointer-events-none absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white via-white/60 to-transparent z-10" />

        <ul className="space-y-3 py-2">
          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <li
                key={`skeleton-${i}`}
                className="scroll-card rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3 animate-pulse"
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
            displayTools.map((tool, i) => {
              const uniqueKey = `${tool.name}-${i}`;
              return (
                <li
                  key={uniqueKey}
                  ref={(el) => {
                    cardsRef.current[i] = el;
                  }}
                  className={clsx(
                    "scroll-card group flex items-center gap-3",
                    "rounded-lg border border-gray-200 bg-white px-1 py-1"
                  )}
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-md bg-primary-way-10">
                    <Image
                      src={tool.iconData || "/icons/tool-fallback.svg"}
                      width={40}
                      height={40}
                      alt={`${tool.name} icon`}
                      title={`${tool.name} icon`}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-secondary-db-100 text-sm text-start truncate">
                      {tool.name}
                    </h4>
                    {tool.shortDescription && (
                      <p className="text-xs text-secondary-db-70 text-start line-clamp-2">
                        {tool.shortDescription}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="bg-white mt-3 flex flex-col rounded-xl">
        <p className="text-secondary-db-80 text-base font-medium mt-2 px-4 pb-4 text-left">
          All the tools you need in one place.
        </p>
      </div>
    </div>
  );
}