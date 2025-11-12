"use client";
import clsx from "clsx";
import React, { useState } from "react";

export default function GlassModeCard({ className }: { className?: string }) {
  const [isGlassMode, setIsGlassMode] = useState(false);

  return (
    <div
      className={clsx(
        "p-6 rounded-2xl shadow border border-gray-100 flex flex-col justify-center items-start transition-all duration-300",
        isGlassMode ? " wayspace-cursor" : " wayspace-cursor",
        className
      )}
    >
      <button
        className={clsx(
          "text-sm font-semibold px-4 py-2 rounded-xl transition",
          isGlassMode ? "text-black glass wayspace-cursor" : "text-white bg-primary-way-100 wayspace-cursor"
        )}
        onClick={() => setIsGlassMode((prev) => !prev)}
      >
        {isGlassMode ? "Default Mode" : "Glass Mode"}
      </button>
      <h3 className="text-lg font-semibold text-gray-900 mt-3">Liquid Glass</h3>
      <p className="text-gray-600 text-sm">
        A dynamic, Liquid glass mode that keeps you more focused.
      </p>
    </div>
  );
}