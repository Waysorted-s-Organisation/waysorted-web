"use client";
import Image from "next/image";
import clsx from "clsx";

export default function LighterCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-2xl shadow border border-gray-100 p-6 w-full bg-white flex",
        "ripple-animated", // add custom class
        className
      )}
    >
      {/* Ripple layer */}
      <div className="ripples">
        <span className="ripple-ring" />
        <span className="ripple-ring" />
        <span className="ripple-ring" />
        <div className="ripple-soft-gradient" />
      </div>

      <div className="flex-1 relative z-10">
        <div className="flex items-center justify-between text-xs text-blue-600 gap-2">
          <span className="px-2 py-0.5 bg-gradient-to-r from-[#E8EFFC] to-white rounded-md flex items-center gap-1 font-regular text-secondary-db-70 ring-1 ring-white/38">
            <Image src="/icons/lightning-blue.svg" alt="Zero Latency" width={8} height={12} /> Zero Latency
          </span>
          <span className="px-2 py-0.5 bg-gradient-to-r from-[#E8EFFC] to-white rounded-md flex items-center gap-1 translate-y-10 text-secondary-db-70 font-regular ring-1 ring-white/38">
            <Image src="/icons/lightning-blue.svg" alt="Zero Latency" width={8} height={12} /> Super Fast
          </span>
        </div>
        <div className="mt-4 flex justify-center">
          <Image src="/icons/leaf.svg" alt="Lighter Speed" width={65} height={50} />
        </div>
        <h4 className="text-gray-700 font-medium mt-8 text-center">
          Feels lighter on your device.
        </h4>
      </div>
    </div>
  );
}