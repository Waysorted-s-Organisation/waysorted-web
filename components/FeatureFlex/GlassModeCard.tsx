"use client";
import clsx from "clsx";
import React from "react";
import Image from "next/image";

export default function GlassModeCard({ className }: { className?: string }) {

  return (
    <div
      className={clsx(
        // text-start, because the hero section five levels up sets text-center for
        // its own copy and every card in this grid inherits it. This card places
        // its children with items-start, so the inherited centring left a
        // left-aligned heading sitting above centred body copy. WayAICard pins its
        // own alignment against the same leak.
        "p-6 relative rounded-2xl border border-gray-100 flex flex-col justify-start items-start text-start overflow-hidden transition-all duration-300 wayspace-cursor",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900">Liquid Glass</h3>
      <p className="text-secondary-db-80 text-base font-medium">
        A dynamic, Liquid glass mode that keeps you more focused.
      </p>
      {/* 480 x 91 is the asset's own 1677:317 ratio - declaring 128 reserved ~53px
          more than the image ever paints, which is what shifted this card. */}
      <Image
        src="/icons/glass-mode.png"
        alt="Glass mode"
        title="Glass mode"
        width={480}
        height={91}
        className="mt-auto"
        sizes="(max-width: 768px) 100vw, 480px"
      />
    </div>
  );
}