"use client";
import Image from "next/image";
import clsx from "clsx";

/**
 * WayAICard
 * - Recreates the card look from the provided screenshots with two blurred ellipse layers.
 * - Blur layers:
 *   - tertiary-orange-500: 131x87, blur 111
 *   - primary-way-100:     251x113, blur 83
 *
 * Notes:
 * - Positions are based on the second image. You can fine‑tune offsets by changing the `top/left/right` values below.
 * - This assumes you have `tertiary-orange-500` and `primary-way-100` colors in your Tailwind config.
 */
export default function WayAICard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        // Card container
        "relative w-full overflow-hidden rounded-2xl bg-white shadow border border-gray-100",
        // Spacing similar to the mock
        "px-5 py-6 sm:px-6 sm:py-7",
        className
      )}
    >
      {/* Decorative blur layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        {/* Small orange ellipse (131x87, blur 111) */}
        <div
          className={clsx(
            "absolute rounded-full blur-[111px]",
            // Color with slight transparency so it blends like the mock
            "bg-tertiary-orange-500"
          )}
          style={{
            width: 131,
            height: 87,
            // Positioned per the second screenshot: slightly outside the left edge, near the top-left
            left: -100, // adjust to -110 ~ -80 to taste
            top: -20,
          }}
        />

        {/* Large primary ellipse (251x113, blur 83) */}
        <div
          className={clsx(
            "absolute rounded-full blur-[60px]",
            "bg-primary-way-100"
          )}
          style={{
            width: 251,
            height: 113,
            // Based on the second image: starts near the top, extends toward the right
            top: -70,
            left: 126, // nudge between 110 ~ 150 to match your exact layout
          }}
        />

        {/* Soft fade to white toward the bottom, like the mock */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Subtle circular halo behind the logo to match the mock */}
          <div className="relative h-9 w-9 rounded-full bg-white/40 ring-1 ring-white/50 backdrop-blur-[2px] flex items-center justify-center">
            <Image
              src="/icons/way-ai.svg"
              alt="Way AI"
              width={22}
              height={22}
              className="opacity-90"
            />
          </div>
        </div>

        {/* "Coming Soon" pill in the top-right */}
        <span className="text-xs px-2.5 py-1 rounded-md bg-white/60 text-primary-way-100">
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