"use client";
import React from "react";
import Image from "next/image";

const releaseNotes = [
  {
    image: "/images/release1.png",
    title: "Release Notes 1",
    description: "We've added new features to improve your experience.",
  },
  {
    image: "/images/release2.png",
    title: "Release Notes 2",
    description: "Performance improvements and bug fixes in this update.",
  },
  {
    image: "/images/release3.png",
    title: "Release Notes 3",
    description: "Introducing AI-powered recommendations for better results.",
  },
];

const CardCarousel = () => {
  return (
    <div
      id="card-carousel"
      className="relative w-full bg-secondary-db-90 rounded-xl p-4 flex flex-col justify-between"
      data-carousel="slide"
    >
      {/* Carousel Wrapper */}
      <div className="relative h-80 overflow-hidden rounded-xl">
        {releaseNotes.map((note, index) => (
          <div
            key={index}
            className={`hidden duration-700 ease-in-out`}
            data-carousel-item={index === 0 ? "active" : ""}
          >
            {/* Image */}
            <div className="w-full h-48 rounded-md mb-3 relative overflow-hidden bg-secondary-db-80">
              <Image
                src={note.image}
                alt={note.title}
                fill
                className="object-cover rounded-md"
              />
            </div>

            {/* Title */}
            <h4 className="text-white font-medium text-xl">{note.title}</h4>

            {/* Description */}
            <p className="text-gray-400 text-sm text-regular mb-3">
              {note.description}
            </p>
          </div>
        ))}
      </div>

      {/* Slider Indicators */}
      <div className="flex gap-2 justify-center items-center mt-3">
        {releaseNotes.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`w-3 h-3 rounded-full ${
              index === 0 ? "bg-gray-200" : "bg-white0"
            }`}
            aria-current={index === 0 ? "true" : "false"}
            aria-label={`Slide ${index + 1}`}
            data-carousel-slide-to={index}
          ></button>
        ))}
      </div>
    </div>
  );
};

<div className="bg-secondary-db-90 rounded-xl p-4 h-78 flex flex-col justify-between">
              <div>
                <div className="bg-secondary-db-80 w-full h-50 rounded-md mb-3">images</div>
                <h4 className="text-white font-medium text-xl">Release Notes !</h4>
                <p className="text-gray-400 text-sm text-regular mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>

              <div className="flex gap-2 justify-center items-center">
                <span className="w-3 h-1 bg-gray-200 rounded-full"></span>
                <span className="w-2 h-1 bg-white0 rounded-full"></span>
                <span className="w-2 h-1 bg-white0 rounded-full"></span>
              </div>
            </div>

export default CardCarousel;
