"use client";

import Image from "next/image";
import FeatureFlex from "../FeatureFlex";

export default function TopSection() {

  return (
    <section className="w-full flex flex-col items-center justify-center text-center px-4 md:px-0">

      <p className="text-secondary-db-70 font-medium md:text-xl leading-normal md:leading-relaxed mb-1 max-w-[345px] md:max-w-6xl mx-auto">
        Blends into your workflow with smooth integration
      </p>

      {/* Heading */}
      <h1 className="text-2xl sm:text-4xl font-medium text-secondary-db-100 mb-4 max-w-[345px] md:max-w-none leading-tight md:leading-snug">
        Designed to work seamlessly{" "}
        <span className="text-secondary-db-60">
          into your Software
        </span>
      </h1>

      {/* Description */}
      

      {/* Buttons */}
      <div className="w-full max-w-[345px] md:max-w-none mx-auto md:flex md:justify-center overflow-hidden">
        <div className="flex gap-2 md:gap-6 overflow-x-auto md:overflow-visible pb-4 -mb-4 md:pb-0 md:mb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Way Studio Button */}
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary-way-100 bg-primary-way-10 px-4 md:px-5 py-[7px] md:py-3 text-secondary-db-100 font-semibold text-xs md:text-base cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-way-100"
          >
            <Image
              src="/icons/figma-black.svg"
              alt="Figma Icon"
              width={30}
              height={30}
              className="shrink-0"
            />
            <span className="font-semibold text-xs md:text-base gap-2 flex items-center">
              For Figma
              <span className="hidden md:inline bg-white rounded-full px-2 py-0.5 text-xs text-primary-way-100 text-center"> Early Access Live </span>
            </span>
          </button>

          {/* Waysorted for Figma Button */}
          <button
            className={`flex shrink-0 items-center justify-center gap-2 px-4 md:px-5 py-[7px] md:py-3 rounded-full cursor-not-allowed bg-primary-way-5`}>
            <Image
              src="/icons/webflow-icon.svg"
              alt="Webflow Icon"
              width={30}
              height={30}
              className="shrink-0"
            />
            <span className="font-semibold text-xs md:text-base text-secondary-db-70">
              For Webflow
            </span>
          </button>
          <button
            className={`flex shrink-0 items-center justify-center gap-2 px-4 md:px-5 py-[7px] md:py-3 rounded-full cursor-not-allowed bg-primary-way-5`}>
            <Image
              src="/icons/canva.svg"
              alt="Canva Icon"
              width={30}
              height={30}
              className="shrink-0"
            />
            <span className="font-semibold text-xs md:text-base text-secondary-db-70">
              For Canva
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="w-full max-w-[345px] md:max-w-6xl mx-auto mt-6 md:mt-8">
          <FeatureFlex />
      </div>
    </section>
  );
}