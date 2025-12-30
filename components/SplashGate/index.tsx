"use client";

import * as React from "react";
import SequentialLogoLoader, { IconDef } from "@/components/SequentialLoader";
import { InfinityIcon } from "@/components/icons/InfinityIcon";
import { GridIcon } from "@/components/icons/GridIcon";
import { BoltIcon } from "@/components/icons/BoltIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";

type Props = {
  minMs?: number;        // minimum time to keep splash visible
  initialOnly?: boolean; // show only on first load in this tab
  children: React.ReactNode;
};

export default function SplashGate({
  minMs = 2000,
  initialOnly = true,
  children,
}: Props) {
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
    // If you only want to show the splash once per tab, use sessionStorage
    if (initialOnly && typeof window !== "undefined") {
      const shown = sessionStorage.getItem("splash-shown");
      if (shown === "1") {
        setShow(false);
        return;
      }
    }

    const t = setTimeout(() => {
      setShow(false);
      if (initialOnly && typeof window !== "undefined") {
        sessionStorage.setItem("splash-shown", "1");
      }
    }, minMs);

    return () => clearTimeout(t);
  }, [minMs, initialOnly]);

  const icons: IconDef[] = [
    { id: "infinity", Icon: InfinityIcon, activeClass: "text-[#24B7FD]", bgClass: "bg-[#E9F7FE]", iconPx: 64 },
    { id: "grid", Icon: GridIcon, activeClass: "text-[#7531F9]", bgClass: "bg-[#F1EAFE]", iconPx: 108 },
    { id: "bolt", Icon: BoltIcon, activeClass: "text-[#FF7920]", bgClass: "bg-[#FFF1E8]", iconPx: 108 },
    { id: "check", Icon: CheckIcon, activeClass: "text-[#01A04E]", bgClass: "bg-[#E5F5ED]", iconPx: 108 },
  ];

  return (
    <>
      {children}

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white">
          <SequentialLogoLoader
            icons={icons}
            estimatedMs={minMs}  // keep animation in sync with splash duration
            tileSizePx={188}     // your requested tile size
          />
        </div>
      )}
    </>
  );
}