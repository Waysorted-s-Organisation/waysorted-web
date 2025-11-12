"use client";
import Image from "next/image";
import clsx from "clsx";

export default function WayAICard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "w-full p-5 rounded-xl bg-white shadow border border-gray-100 flex flex-col items-start justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Image src="/icons/way-ai.svg" alt="Way AI" width={30} height={30} />
        <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
          Coming Soon
        </span>
      </div>
      <div>
        <h3 className="mt-2 text-base font-semibold text-gray-900">Way AI</h3>
        <p className="text-gray-600 text-sm leading-snug">
          Unlock your potential with Way AI suite.
        </p>
      </div>
    </div>
  );
}