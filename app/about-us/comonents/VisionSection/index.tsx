"use client";
import Image from "next/image";

export default function VisionSection() {
  return (
    <section className="bg-white text-center px-6 md:px-20 lg:px-32 py-16">
      {/* Label */}
      <span className="inline-flex items-center text-sm font-medium bg-[#F3F3F3] text-[#565A5E] rounded-md mb-4">
  <Image
    src="/icons/avail.svg"
    alt="Our Mission"
    width={24}
    height={24}
    className="block"
  />
  <span className="px-3 py-1">Our Mission & Vision</span>
</span>



      {/* Vision Statement */}
      <p className="text-4xl font-light leading-relaxed max-w-4xl mx-auto">
        Our Vision is to{" "}
        <span className="font-semibold text-[#0D1218]">
          create a world where designers can focus entirely on their ideas
        </span>
        —without losing{" "}
        <span className="font-semibold text-[#0D1218]">time, energy,</span> or{" "}
        <span className="font-semibold text-[#0D1218]">creativity</span> to tool chaos.
      </p>
    </section>
  );
}
