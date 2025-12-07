"use client";
import clsx from "clsx";
import Image from "next/image";

export default function WayspaceCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "p-6 rounded-2xl shadow border border-gray-100 flex flex-col text-left w-full",
        className
      )}
    >
      <h3 className="text-xl font-semibold text-gray-900">Wayspace</h3>

      <div className="mt-5 flex gap-1 justify-between">
        <div className="flex flex-col items-center text-center" >
          <div className="w-20 h-20">
          <Image
            src="/icons/wayspace-1.svg"
            height={89}
            width={89}
            alt="Wayspace 1"
            className="object-contain"
          />
          </div>
          <div className="text-sm font-regular text-[#939393]">Frames to PDF</div>
        </div>
        <div className="flex flex-col items-center text-center" >
          <div className="w-20 h-20">
          <Image
            src="/icons/wayspace-2.svg"
            height={89}
            width={89}
            alt="Wayspace 2"
            className="object-contain"
          />
          </div>
          <div className="text-sm font-regular text-secondary-db-100">Palettable</div>
        </div><div className="flex flex-col items-center text-center" >
          <div className="w-20 h-20">
          <Image
            src="/icons/wayspace-3.svg"
            height={89}
            width={89}
            alt="Wayspace 3"
            className="object-contain"
          />
          </div>
          <div className="text-sm font-regular text-[#939393]">Unit Convertor</div>
        </div>
        
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3">
        <div className="h-18 w-18 rounded-xl bg-[#ECF2FF] flex items-center justify-center text-[#91adea] text-sm">
          Your
        </div>
        <div className="h-18 w-18 rounded-xl bg-[#ECF2FF] flex items-center justify-center text-[#91adea] text-sm">
          Favorite
        </div>
        <div className="h-18 w-18 rounded-xl bg-[#ECF2FF] flex items-center justify-center text-[#91adea] text-sm">
          Tools
        </div>
      </div>
      <p className="text-secondary-db-80 text-base font-medium mt-10">
        Personalize and customize your tools as per your usage.
      </p>
    </div>
  );
}