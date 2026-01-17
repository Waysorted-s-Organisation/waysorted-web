"use client";
import Image from "next/image";

export default function StorySection() {
  return (
    <section id="story" className="gray-bg-dots text-white px-4 mx-auto md:px-34 py-16 md:py-40 relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto">
        <div className="absolute w-[180px] h-[180px] right-10 -top-5 spin">
        <Image
          src="/icons/geek-sticker.svg"
          alt="Geek Sticker"
          fill
          className="object-contain"
        />
      </div>
        {/* Heading */}
        <h2 className="text-4xl md:text-6xl font-medium mb-8 max-w-lg">
          This is what we believe.
        </h2>

        {/* Paragraphs */}
        <div className="space-y-6 text-white/80 text-lg md:text-xl font-light leading-relaxed max-w-3xl">
          <p>
            Waysorted was built to cut through the chaos of modern creative workflows. We know the mess, too many tools, broken focus, and ideas lost between tabs. So we built optimized tools that keep everything aligned and effortless.
          </p>
          <p>
            Our belief is simple: clarity over clutter, speed over struggle, and creativity over chaos. Waysorted helps creators move faster, stay in flow, and design with confidence. When the workflow steps aside, creativity takes over.
          </p>
          <p className="font-medium pt-10">
            That’s WaySorted, designed to keep creators in their zone.
          </p>
        </div>
      </div>
    </section>
  );
}