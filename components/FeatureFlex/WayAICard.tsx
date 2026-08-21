"use client";
import Image from "next/image";
import clsx from "clsx";

export default function WayAICard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl bg-white border border-gray-100",
        "px-5 py-6 sm:px-6 sm:py-7",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <div
          className={clsx(
            "absolute rounded-full blur-[40px]",
            "bg-tertiary-orange-500"
          )}
          style={{
            width: 131,
            height: 87,
            left: -90,
            top: -20,
          }}
        />

        <div
          className={clsx(
            "absolute rounded-full blur-[40px]",
            "bg-primary-way-100"
          )}
          style={{
            width: 251,
            height: 113,
            top: -34,
            left: 54,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center">
        <div className="flex items-center gap-3">
          <div className="relative h-13 w-13 rounded-full bg-white/25 flex items-center justify-center">
            <Image
              src="/icons/way-ai-white.svg"
              alt="Way AI"
              title="Way AI"
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <p className="text-secondary-db-80 font-medium text-base text-start">
          Unlock your potential with Way AI suite.
        </p>
      </div>
    </div>
  );
}