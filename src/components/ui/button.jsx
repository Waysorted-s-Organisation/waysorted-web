'use client'
import React from "react";

const Button = ({ 
  label = "Click Me", 
  className = "", 
  circleClassName = "",
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center justify-center 
        rounded-full overflow-hidden transition duration-300 
        md:w-48 md:h-20 w-32 h-14 
        ${className}
      `}
    >
      {/* Customizable Decorative Circle */}
      <div
        className={`
          absolute 
          md:w-60 md:h-60 w-36 h-36 
          rounded-full top-2 left-1/2 transform -translate-x-1/2 
          transition-all duration-500 ease-in-out 
          group-hover:-translate-y-12 z-0 
          ${circleClassName}
        `}
      ></div>

      {/* Button Label */}
      <span className="relative z-10 text-center md:text-2xl text-base font-medium mt-1">
        {label}
      </span>
    </button>
  );
};

export default Button;
