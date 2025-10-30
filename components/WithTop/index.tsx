"use client";

import Image from "next/image";

export default function WithTop() {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-40">
      {/* Badge */}
      <span className="inline-flex items-center text-xs sm:text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-4">
        <Image
          src="/icons/waysorted.svg"
          alt="With WaySorted"
          width={28}
          height={28}
          className="block p-1"
        />
        <span className="pl-1 pr-2 py-1 text-secondary-db-100">With WaySorted</span>
      </span>

      {/* Heading */}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-secondary-db-100 leading-tight mb-2 sm:mb-4">
        One Stop Digital Toolkit for Makers
      </h1>

      {/* Steps: responsive grid (2 columns on mobile, 4 on sm+) */}
      <div className="max-w-6xl w-full grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 py-10 sm:py-16 place-items-center">
        <div className="flex flex-col items-center">
          <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm flex items-center justify-center">
            <Image src="/icons/" alt="Launch Way icon" width={30} height={30} className="block" />
          </div>
          <p className="text-secondary-db-100 mt-3 sm:mt-6 text-center text-sm sm:text-base font-medium">
            Launch Way
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm flex items-center justify-center">
            <Image src="/icons/" alt="Pick your tools icon" width={30} height={30} className="block" />
          </div>
          <p className="text-secondary-db-100 mt-3 sm:mt-6 text-center text-sm sm:text-base font-medium">
            Pick your tools
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm flex items-center justify-center">
            <Image src="/icons/" alt="Bundle them in Wayspace icon" width={30} height={30} className="block" />
          </div>
          <p className="text-secondary-db-100 mt-3 sm:mt-6 text-center text-sm sm:text-base font-medium">
            Bundle them in Wayspace
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-secondary-db-5 h-16 w-16 p-4 rounded-2xl shadow-sm flex items-center justify-center">
            <Image src="/icons/" alt="Access and work faster icon" width={30} height={30} className="block" />
          </div>
          <p className="text-secondary-db-100 mt-3 sm:mt-6 text-center text-sm sm:text-base font-medium">
            Access & work faster
          </p>
        </div>
      </div>
    </section>
  );
}