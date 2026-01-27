"use client";

import { useState, useEffect } from "react";
import SequentialLogoLoader, { IconDef } from "@/components/SequentialLoader";
import { InfinityIcon } from "@/components/icons/InfinityIcon";
import { GridIcon } from "@/components/icons/GridIcon";
import { BoltIcon } from "@/components/icons/BoltIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";

export default function SessionLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem("waysorted-intro-shown");

    if (hasSeenLoader) {
      setShow(false);
    } else {
      const timer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("waysorted-intro-shown", "true");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const icons: IconDef[] = [
    { id: "infinity", Icon: InfinityIcon, activeClass: "text-[#24B7FD]", bgClass: "bg-[#E9F7FE]" },
    { id: "grid", Icon: GridIcon, activeClass: "text-[#7531F9]", bgClass: "bg-[#F1EAFE]" },
    { id: "bolt", Icon: BoltIcon, activeClass: "text-[#FF7920]", bgClass: "bg-[#FFF1E8]" },
    { id: "check", Icon: CheckIcon, activeClass: "text-[#01A04E]", bgClass: "bg-[#E5F5ED]" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-white select-none">
      <SequentialLogoLoader
        icons={icons}
        estimatedMs={2000}
        tileSizePx={188}
        iconPx={96}
        mobileTileSizePx={140}
        mobileIconPx={72}
      />
    </div>
  );
}