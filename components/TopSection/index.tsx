"use client";

import { useState } from "react";
import Image from "next/image";
import FeatureFlex from "../FeatureFlex";

export default function TopSection() {
  const [activeTab, setActiveTab] = useState<"waystudio" | "figma">("figma");

  return (
    <section className="w-full flex flex-col items-center justify-center text-center">
      {/* Badge */}
      <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 rounded-md mb-4">
        <Image
          src="/icons/avail.svg"
          alt="Our Impact"
          width={30}
          height={30}
          className="block p-1"
        />
        <span className="pl-1 pr-2 py-1 text-secondary-db-100">Available On</span>
      </span>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-secondary-db-100 mb-4">
        Designed for Every{" "}
        <span className="bg-section-bg text-tertiary-blue-500 px-2 rounded-md">
          Workflow
        </span>
      </h1>

      {/* Description */}
      <p className="max-w-6xl text-secondary-db-70 text-base sm:text-lg leading-relaxed mb-6">
        Use Waysorted in your browser or directly inside your favorite design
        space seamlessly fitting into how you already work.
      </p>

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {/* Way Studio Button */}
        <button
          disabled
          className="flex items-center gap-2 px-9 py-1.75 rounded-full cursor-not-allowed border bg-secondary-db-5 border-gray-200 text-secondary-db-50 opacity-60"
        >
          <Image
            src="/icons/waystudio-icon.svg"
            alt="Way Studio"
            width={20}
            height={20}
            className="opacity-70"
          />
          <span className="text-sm font-medium">Way Studio (Coming Soon)</span>
        </button>

        {/* Waysorted for Figma Button */}
        <button
          onClick={() => setActiveTab("figma")}
          className={`flex items-center gap-2 px-6 py-1.75 rounded-full cursor-pointer border transition-all duration-200 ${
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
          />
          <span className="text-sm font-medium">Waysorted for Figma</span>
        </button>
      </div>

      {/* Dynamic Content */}
      <div className="w-full max-w-6xl">
        {activeTab === "figma" ? (
          <FeatureFlex />
        ) : (
          <div className="text-secondary-db-100 text-base">
            <p>
              Way Studio coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
