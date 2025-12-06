"use client";
import Image from "next/image";
import clsx from "clsx";

export default function WayAICard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl bg-white shadow border border-gray-100",
        "px-5 py-6 sm:px-6 sm:py-7",
        className
      )}
    >
      {/* Background effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        {/* Small orange ellipse (131x87, blur 111) */}
        <div
          className={clsx(
            "absolute rounded-full blur-[40px]",
            // Color with slight transparency so it blends like the mock
            "bg-tertiary-orange-500"
          )}
          style={{
            width: 131,
            height: 87,
            // Positioned per the second screenshot: slightly outside the left edge, near the top-left
            left: -90, // adjust to -110 ~ -80 to taste
            top: -20,
          }}
        />

        {/* Large primary ellipse (251x113, blur 83) */}
        <div
          className={clsx(
            "absolute rounded-full blur-[40px]",
            "bg-primary-way-100"
          )}
          style={{
            width: 251,
            height: 113,
            // Based on the second image: starts near the top, extends toward the right
            top: -34,
            left: 54, // nudge between 110 ~ 150 to match your exact layout
          }}
        />

        {/* Soft fade to white toward the bottom, like the mock */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Subtle circular halo behind the logo to match the mock */}
          <div className="relative h-13 w-13 rounded-full bg-white/25 flex items-center justify-center">
            <Image
              src="/icons/way-ai-white.svg"
              alt="Way AI"
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
        </div>

        {/* "Coming Soon" pill in the top-right */}
        <span className="text-xs px-2.5 py-1 rounded-md bg-white/60 text-primary-way-100 translate-y-[-24px] translate-x-[8px]">
          Coming Soon
        </span>
      </div>

      <div className="relative z-10 mt-8">
        <p className="text-secondary-db-80 font-medium text-base text-start">
          Unlock your potential with Way AI suite.
        </p>
      </div>
    </div>
  );
}