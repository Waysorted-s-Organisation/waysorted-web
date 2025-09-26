"use client";

import SequentialLogoLoader, { IconDef } from "@/components/SequentialLoader";
import { InfinityIcon } from "@/components/icons/InfinityIcon";
import { GridIcon } from "@/components/icons/GridIcon";
import { BoltIcon } from "@/components/icons/BoltIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";

export default function Loading() {
  const icons: IconDef[] = [
    { id: "infinity", Icon: InfinityIcon, activeClass: "text-[#24B7FD]", bgClass: "bg-[#E9F7FE]" },
    { id: "grid", Icon: GridIcon, activeClass: "text-[#7531F9]", bgClass: "bg-[#F1EAFE]" },
    { id: "bolt", Icon: BoltIcon, activeClass: "text-[#FF7920]", bgClass: "bg-[#FFF1E8]" },
    { id: "check", Icon: CheckIcon, activeClass: "text-[#01A04E]", bgClass: "bg-[#E5F5ED]" },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <SequentialLogoLoader
        icons={icons}
        estimatedMs={4000}
        tileSizePx={188}  // tile is exactly 188x188 px
        iconPx={96}       // tweak to taste (about ~50% of tile)
      />
    </div>
  );
}