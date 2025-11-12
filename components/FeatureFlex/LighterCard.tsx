"use client";
import Image from "next/image";
import clsx from "clsx";

export default function LighterCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-2xl shadow border border-gray-100 p-6 flex items-center gap-4 w-full",
        className
      )}
    >
      <div className="shrink-0">
        <Image src="/icons/rocket.svg" alt="Lighter" width={44} height={44} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <span className="px-2 py-0.5 bg-blue-50 rounded-md">Zero Latency</span>
          <span className="px-2 py-0.5 bg-blue-50 rounded-md">Super Fast</span>
        </div>
        <h4 className="text-gray-900 font-semibold mt-2">Feels lighter on your device.</h4>
        <p className="text-gray-600 text-sm mt-1">
          Optimized interactions and rendering to keep things snappy.
        </p>
      </div>
    </div>
  );
}