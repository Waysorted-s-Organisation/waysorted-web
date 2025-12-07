"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ReleaseNote {
  id: number;
  title: string;
  description: string;
  image?: string;
}

const notes: ReleaseNote[] = [
  {
    id: 1,
    title: "Release Notes !",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    // image: "/path/to/image.png" // Optional
  },
  {
    id: 2,
    title: "New Features Added",
    description: "Check out the latest tools we just added to the platform.",
  },
  {
    id: 3,
    title: "Performance Update",
    description: "We've improved load times by 50% in the latest patch.",
  },
];

export default function ReleaseNotesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Optional: Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notes.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const currentNote = notes[currentIndex];

  return (
    <div className="bg-secondary-db-90 rounded-xl p-3 sm:p-4 md:p-5 min-h-[220px] flex flex-col justify-between h-full">
      <div className="transition-opacity duration-300 ease-in-out">
        {/* Image Placeholder area */}
        <div className="bg-secondary-db-80 w-full h-36 sm:h-40 md:h-48 rounded-md mb-3 sm:mb-4 relative overflow-hidden">
             {/* You can put an actual Image component here based on currentNote.image */}
             {currentNote.image && (
                 <Image 
                   src={currentNote.image} 
                   alt={currentNote.title} 
                   fill 
                   className="object-cover" 
                 />
             )}
        </div>
        
        <h4 className="text-white font-medium text-lg sm:text-xl line-clamp-1">
          {currentNote.title}
        </h4>
        <p className="text-gray-400 text-xs sm:text-sm text-regular mb-2 sm:mb-3 line-clamp-2">
          {currentNote.description}
        </p>
      </div>

      {/* Dots Indicator */}
      <div className="flex gap-2 justify-center items-center mt-auto pt-2">
        {notes.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "w-8 bg-gray-200/70"
                : "w-6 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}