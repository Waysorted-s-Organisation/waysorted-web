"use client";
import clsx from "clsx";

export default function WayspaceCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "p-6 rounded-2xl shadow border border-gray-100 flex flex-col text-left w-full",
        className
      )}
    >
      <h3 className="text-xl font-semibold text-gray-900">Wayspace</h3>
      <p className="text-gray-600 text-sm mt-2">
        Personalize and customize your tools as per your usage.
      </p>

      <div className="mt-5 flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-gray-100" />
        <div className="w-20 h-20 rounded-xl bg-gray-100" />
        <div className="w-20 h-20 rounded-xl bg-gray-100" />
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3">
        <div className="h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Your
        </div>
        <div className="h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Favorite
        </div>
        <div className="h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Tools
        </div>
      </div>
    </div>
  );
}