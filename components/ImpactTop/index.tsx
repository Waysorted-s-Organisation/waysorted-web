"use client";

import Image from "next/image";

export default function ImpactTop() {

  return (
    <section className="w-full flex flex-col items-center justify-center text-center">
      {/* Badge */}
      <div className="px-2 py-2 mb-4 bg-primary-dark-5 text-primary-dark-70 text-xs rounded-lg flex items-center gap-1">
        <Image
          src="/icons/impact.svg"
          alt="Our Impact"
          width={18}
          height={18}
          className="inline-block"
        />
        Available On
      </div>

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