"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export const FloatingButton = () => {
  const [scrolled, setScrolled] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCloseClick = () => setClosed(true);
  const handleFloatingClick = () => setClosed(false);

  const shouldHideText = scrolled || closed;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2">
      {/* Pill with preview on hover */}
      {!shouldHideText && (
        <div className="relative group">
          <div className="flex items-center bg-white rounded-full shadow px-3 py-2 max-w-xs overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleCloseClick}
              className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center mr-2"
            >
              <Image
                src="/icons/close.svg"
                alt="Close"
                width={16}
                height={16}
              />
            </button>

            {/* Text content */}
            <p className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>

          {/* Hover Preview Card */}
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-50">
            <div className="text-sm font-semibold">Example Website</div>
            <div className="text-xs text-gray-500 mb-1">www.example.com</div>
            <div className="text-xs text-gray-700">
              This is a sample website description. Visit to know more!
            </div>
            <img
              src="https://via.placeholder.com/300x100"
              alt="Preview"
              className="mt-2 rounded w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Floating Blue Button */}
      <button
        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center"
        onClick={handleFloatingClick}
      >
        <Image
          src="/icons/floating-button.svg"
          alt="Floating"
          width={20}
          height={20}
        />
      </button>
    </div>
  );
};
