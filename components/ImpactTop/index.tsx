"use client";

import Image from "next/image";

export default function ImpactTop() {

  return (
    <section className="w-full pt-32 flex flex-col items-center justify-center text-center">
      {/* Badge */}
      <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-4">
  <Image
    src="/icons/impact.svg"
    alt="Our Impact"
    width={30}
    height={30}
    className="block p-1"
  />
  <span className="pl-1 pr-2 py-1 text-secondary-db-100">Our Impact</span>
</span>


      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-secondary-db-100 mb-4">
        A platform you can{" "}
        <span className="bg-section-bg text-tertiary-blue-500 px-2">
          Trust!
        </span>
      </h1>

      {/* Description */}
      <p className="max-w-6xl text-secondary-db-70 text-base sm:text-lg leading-relaxed mb-6">
        Reviewed by figma usersLorem ipsum dolor sit amet, cons.
      </p>
    </section>
  );
}