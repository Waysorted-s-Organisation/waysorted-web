"use client";
import clsx from "clsx";
import React from "react";
import Image from "next/image";

export default function GlassModeCard({ className }: { className?: string }) {

  return (
    <div
      className={clsx(
        "p-6 relative rounded-2xl shadow border border-gray-100 flex flex-col justify-center items-start transition-all duration-300 wayspace-cursor",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 mt-3">Liquid Glass</h3>
      <p className="text-gray-600 text-sm">
        A dynamic, Liquid glass mode that keeps you more focused.
      </p>
        <Image
        src="/icons/glass-mode.png"
        alt="Glass mode"
        width={480}
        height={128}
        className="translate-y-[40px]"
        />
    </div>
  );
}