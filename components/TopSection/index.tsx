"use client";

import { useState } from "react";
import Image from "next/image";
import FeatureFlex from "../FeatureFlex";

export default function TopSection() {
  const [activeTab, setActiveTab] = useState<"waystudio" | "figma">("figma");

  return (
    <section className="w-full flex flex-col items-center justify-center text-center px-4 md:px-0">
      {/* Badge */}
      <span className="inline-flex items-center gap-1 text-xs md:text-sm font-medium bg-secondary-db-5 rounded-md mb-3 md:mb-4 px-2 py-1">
        <Image
          src="/icons/avail.svg"
          alt="Our Impact"
          width={20}
          height={20}
          className="block"
        />
        <span className="text-secondary-db-100">Available On</span>
      </span>

      {/* Heading */}
      <h1 className="text-2xl sm:text-4xl font-semibold text-secondary-db-100 mb-4 max-w-[345px] md:max-w-none leading-tight md:leading-snug">
        Designed for Every{" "}
        <span className="bg-section-bg text-tertiary-blue-500 px-2 rounded-md">
          Workflow
        </span>
      </h1>

      {/* Description */}
      <p className="text-secondary-db-70 text-base md:text-lg leading-normal md:leading-relaxed mb-5 md:mb-6 max-w-[345px] md:max-w-6xl mx-auto">
        Use Waysorted in your browser or directly inside your favorite design
        space seamlessly fitting into how you already work.
      </p>

      {/* Buttons */}
      <div className="flex gap-2 md:gap-3 justify-center w-full max-w-[345px] md:max-w-none mx-auto flex-nowrap md:flex-wrap">
        {/* Way Studio Button */}
        <button
          disabled
          className="flex flex-1 basis-0 min-w-0 md:flex-none md:basis-auto items-center justify-center gap-2 px-4 md:px-9 py-[7px] md:py-1.75 rounded-full cursor-not-allowed border bg-secondary-db-10 border-gray-200 text-secondary-db-100 text-xs md:text-sm"
        >
          <Image
            src="/icons/waystudio-icon.svg"
            alt="Way Studio"
            width={20}
            height={20}
            className="opacity-70 shrink-0"
          />
          <span className="font-medium truncate">
            Way Studio
            <span className="hidden md:inline"> (Coming Soon)</span>
          </span>
        </button>

        {/* Waysorted for Figma Button */}
        <button
          onClick={() => setActiveTab("figma")}
          className={`flex flex-1 basis-0 min-w-0 md:flex-none md:basis-auto items-center justify-center gap-2 px-4 md:px-6 py-[7px] md:py-1.75 rounded-full cursor-pointer border transition-all duration-200 text-xs md:text-sm ${
            activeTab === "figma"
              ? "bg-white border-secondary-db-100 text-secondary-db-100 shadow-md"
              : "bg-secondary-db-5 border-gray-200 text-secondary-db-70 hover:text-secondary-db-100"
          }`}
        >
          <Image
            src="/icons/figma-icon.svg"
            alt="Waysorted for Figma"
            width={20}
            height={20}
            className="shrink-0"
          />
          <span className="font-medium truncate whitespace-nowrap">
            Waysorted for Figma
          </span>
        </button>
      </div>

      {/* Dynamic Content */}
      <div className="w-full max-w-[345px] md:max-w-6xl mx-auto mt-6 md:mt-8">
        {activeTab === "figma" ? (
          <FeatureFlex />
        ) : (
          <div className="text-secondary-db-100 text-base">
            <p>Way Studio coming soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}