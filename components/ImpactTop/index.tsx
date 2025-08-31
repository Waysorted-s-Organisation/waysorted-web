"use client";

import Image from "next/image";

export default function ImpactTop() {

  return (
    <section className="w-full flex flex-col items-center justify-center text-center">
      {/* Badge */}
      <span className="inline-flex items-center text-sm font-medium bg-[#F3F3F3] text-[#565A5E] rounded-md mb-4">
  <Image
    src="/icons/impact.svg"
    alt="Our Impact"
    width={24}
    height={24}
    className="block"
  />
  <span className="px-3 py-1">Available On</span>
</span>


      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-primary-dark mb-4">
        A platform you can{" "}
        <span className="bg-section-bg text-section-text px-2">
          Trust!
        </span>
      </h1>

      {/* Description */}
      <p className="max-w-6xl text-primary-dark-70 text-base sm:text-lg leading-relaxed mb-6">
        Reviewed by figma usersLorem ipsum dolor sit amet, cons.
      </p>
    </section>
  );
}