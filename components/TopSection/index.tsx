"use client";

import { useState } from "react";
import Image from "next/image";
import FeatureFlex from "../FeatureFlex";

export default function TopSection() {
  const [activeTab, setActiveTab] = useState<"waystudio" | "figma">("figma");

  return (
    <section className="w-full flex flex-col items-center justify-center text-center">
      {/* Badge */}
      <div className="px-2 py-2 mb-4 bg-primary-dark-5 text-primary-dark-70 text-xs rounded-lg flex items-center gap-1">
        <Image
          src="/icons/avail.svg"
          alt="Available"
          width={18}
          height={18}
          className="inline-block"
        />
        Available On
      </div>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-primary-dark mb-4">
        Designed for Every{" "}
        <span className="bg-section-bg text-section-text px-2">
          Workflow
        </span>
      </h1>

      {/* Description */}
      <p className="max-w-6xl text-primary-dark-70 text-base sm:text-lg leading-relaxed mb-6">
        Use Waysorted in your browser or directly inside your favorite design
        space seamlessly fitting into how you already work.
      </p>

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {/* Way Studio Button */}
        <button
          onClick={() => setActiveTab("waystudio")}
          className={`flex items-center gap-2 px-9 py-1.75 rounded-full cursor-pointer border transition-all duration-200 ${
            activeTab === "waystudio"
              ? "bg-white border-primary-dark text-primary-dark"
              : "bg-primary-dark-5 border-gray-200 text-primary-dark-70 hover:text-primary-dark"
          }`}
        >
          <Image
            src="/icons/waystudio-icon.svg"
            alt="Way Studio"
            width={20}
            height={20}
          />
          <span className="text-sm font-medium">Way Studio</span>
        </button>

        {/* Waysorted for Figma Button */}
        <button
          onClick={() => setActiveTab("figma")}
          className={`flex items-center gap-2 px-6 py-1.75 rounded-full cursor-pointer border transition-all duration-200 ${
            activeTab === "figma"
              ? "bg-white border-primary-dark text-primary-dark shadow-md"
              : "bg-primary-dark-5 border-gray-200 text-primary-dark-70 hover:text-primary-dark"
          }`}
        >
          <Image
            src="/icons/figma-icon.svg"
            alt="Waysorted for Figma"
            width={20}
            height={20}
          />
          <span className="text-sm font-medium">Waysorted for Figma</span>
        </button>
      </div>

      {/* Dynamic Content */}
      <div className="w-full max-w-6xl">
        {activeTab === "figma" ? (
          <FeatureFlex />
        ) : (
          <div className="text-primary-dark text-base">
            <p>
              Way Studio coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
