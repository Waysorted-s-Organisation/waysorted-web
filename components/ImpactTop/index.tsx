"use client";

import Image from "next/image";

export default function ImpactTop() {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32">
      {/* Badge */}
      <span className="inline-flex items-center text-xs sm:text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-4">
        <Image
          src="/icons/impact.svg"
          alt="Our Impact"
          width={28}
          height={28}
          className="block p-1"
        />
        <span className="pl-1 pr-2 py-1 text-secondary-db-100">Our Impact</span>
      </span>

      {/* Heading */}
      <h1 className="font-semibold text-secondary-db-100 leading-tight mb-3 sm:mb-4 text-[clamp(1.75rem,6.5vw,2.5rem)] sm:text-4xl md:text-5xl">
        A platform you can{" "}
        <span className="bg-section-bg text-tertiary-blue-500 px-1.5 sm:px-2 rounded">
          Trust!
        </span>
      </h1>

      {/* Description */}
      <p className="text-secondary-db-70 leading-relaxed max-w-2xl sm:max-w-4xl md:max-w-6xl text-sm sm:text-base md:text-lg">
        Reviewed and recommended by users like you.
      </p>
    </section>
  );
}