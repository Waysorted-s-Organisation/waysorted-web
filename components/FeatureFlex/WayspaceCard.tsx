"use client";

import React, { useState, useRef, useEffect, MouseEvent } from "react";
import clsx from "clsx";
import Image from "next/image";
import confetti from "canvas-confetti";

const TOOLS_DATA = [
  {
    id: 1,
    name: "Frames to PDF",
    src: "/icons/wayspace-1.svg",
    textColor: "text-secondary-db-100",
  },
  {
    id: 2,
    name: "Palettable",
    src: "/icons/wayspace-2.svg",
    textColor: "text-secondary-db-100",
  },
  {
    id: 3,
    name: "Unit Convertor",
    src: "/icons/wayspace-3.svg",
    textColor: "text-secondary-db-100",
  },
  {
    id: 4,
    name: "Font Importer",
    src: "/icons/wayspace-4.svg",
    textColor: "text-secondary-db-100",
  },
];

const INFINITE_TOOLS = [...TOOLS_DATA, ...TOOLS_DATA, ...TOOLS_DATA];

export default function WayspaceCard({ className }: { className?: string }) {
  const [favorites, setFavorites] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      scrollRef.current.scrollLeft = scrollWidth / 3;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth } = scrollRef.current;
    const setWidth = scrollWidth / 3;
    if (scrollLeft >= setWidth * 2) {
      scrollRef.current.scrollLeft = scrollLeft - setWidth;
    } else if (scrollLeft <= 0) {
      scrollRef.current.scrollLeft = scrollLeft + setWidth;
    }
  };

  const startDrag = (e: MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  };

  const stopDrag = () => {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  const doDrag = (e: MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();

    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const toggleFavorite = (
    id: number,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favId) => favId !== id);
      } else if (prev.length < 3) {
        // Fire Confetti

        confetti({
          origin: { x, y },
          particleCount: 60,
          spread: 50,
          gravity: 1.2,
          scalar: 0.7,
          zIndex: 9999,

          colors: [
            "#26ccff",
            "#a25afd",
            "#ff5e7e",
            "#88ff5a",
            "#fcff42",
            "#ffa62d",
            "#ff36ff",
          ],
        });

        return [...prev, id];
      }

      return prev;
    });
  };

  const placeholderLabels = ["Your", "Favorite", "Tools"];

  return (
    <div
      className={clsx(
        "p-6 rounded-2xl border border-primary-way-10 flex flex-col text-left w-full bg-white select-none",

        className,
      )}
    >
      <h3 className="text-xl font-semibold text-gray-900">Wayspace</h3>

      <div className="mt-5 relative w-full overflow-hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto cursor-grab scrollbar-hide items-start"
          onScroll={handleScroll}
          onMouseDown={startDrag}
          onMouseLeave={stopDrag}
          onMouseUp={stopDrag}
          onMouseMove={doDrag}
          style={{
            scrollbarWidth: "none",

            msOverflowStyle: "none",

            gap: "1rem",
          }}
        >
          {INFINITE_TOOLS.map((tool, index) => (
            <div
              key={`${tool.id}-${index}`}
              className="flex-none flex flex-col items-center text-center w-[30%]"
            >
              <div className="w-20 h-20 relative group">
                <Image
                  src={tool.src}
                  height={89}
                  width={89}
                  alt={tool.name}
                  title={tool.name}
                  className="object-contain pointer-events-none"
                />

                {/* Heart Button */}

                <button
                  onClick={(e) => toggleFavorite(tool.id, e)}
                  className={clsx(
                    "absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer z-10",

                    favorites.includes(tool.id)
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
                  )}
                >
                  <svg
                    className={clsx(
                      "w-4 h-4 transition-colors",

                      favorites.includes(tool.id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-300",
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <div
                className={clsx("text-sm font-regular mt-1", tool.textColor)}
              >
                {tool.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Favorites Grid --- */}

      <div className="mt-auto grid grid-cols-3 gap-3 mx-auto w-full">
        {[0, 1, 2].map((i) => {
          const favId = favorites[i];

          const tool = favId ? TOOLS_DATA.find((t) => t.id === favId) : null;

          if (tool) {
            return (
              <div
                key={i}
                className="h-18 w-18 aspect-square rounded-xl bg-[#ECF2FF] flex items-center justify-center animate-[bounce_0.4s_ease] relative"
              >
                <div className="w-10 h-10 relative">
                  <Image
                    src={tool.src}
                    alt={tool.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className="h-18 w-18 aspect-square rounded-xl bg-[#ECF2FF] flex items-center justify-center text-[#91adea] text-sm"
            >
              {placeholderLabels[i]}
            </div>
          );
        })}
      </div>

      <p className="text-secondary-db-80 text-base font-medium mt-10">
        Personalize and customize your tools as per your usage.
      </p>
    </div>
  );
}
