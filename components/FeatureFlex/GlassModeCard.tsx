import React, { useState } from "react";

export default function GlassModeCard() {
  const [isGlassMode, setIsGlassMode] = useState(false);

  return (
    <div
      className={`w-[500px] h-[210px] p-6 rounded-2xl shadow border border-gray-100 flex flex-col justify-center items-center transition-all duration-300
        ${isGlassMode ? "glass-bg wayspace-cursor" : "white-bg-dots wayspace-cursor"}
      `}
    >
      <button
        className={`text-lg font-semibold max-w-40 px-4 py-2 rounded-xl transition
          ${isGlassMode ? "text-black glass wayspace-cursor" : "text-white bg-primary-way-100 wayspace-cursor"}
        `}
        onClick={() => setIsGlassMode((prev) => !prev)}
      >
        {isGlassMode ? "Default Mode" : "Glass Mode"}
      </button>
      <p className="text-gray-600 text-sm mt-3">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Suspendisse sit amet scelerisque sapien.
      </p>
    </div>
  );
}