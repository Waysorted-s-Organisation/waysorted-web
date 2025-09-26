"use client";

import * as React from "react";


export type IconDef = {
  id: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeClass: string; // e.g., "text-[#24B7FD]"
  bgClass?: string; 
  iconPx?: number;     // e.g., 84
};

type Props = {
  icons: IconDef[];
  estimatedMs?: number; // total time to reach 100% progress
  className?: string;
  onDone?: () => void;

  // New: control sizes
  tileSizePx?: number;  // square tile size in pixels (width=height)
  iconPx?: number;      // icon size in pixels (we’ll set height and keep width auto for aspect ratio)
};

export default function SequentialLogoLoader({
  icons,
  estimatedMs = 3000,
  className,
  onDone,
  tileSizePx = 64,
  iconPx,
}: Props) {
  const [progress, setProgress] = React.useState(0);

  // Reasonable default: icon ~50% of tile if not provided
  const resolvedIconPx = iconPx ?? Math.round(tileSizePx * 0.5);

  React.useEffect(() => {
    const stepMs = Math.max(10, Math.floor(estimatedMs / 100)); // tick from 0..100
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          onDone?.();
          return 100;
        }
        return p + 1;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [estimatedMs, onDone]);

  const activeCount = React.useMemo(() => {
    if (!icons.length) return 0;
    const perIcon = 100 / icons.length;
    return Math.min(icons.length, Math.ceil(progress / perIcon));
  }, [progress, icons.length]);

  return (
    <div className={["flex flex-col items-center gap-8", className].filter(Boolean).join(" ")}>
      <div className="flex items-center gap-6">
        {icons.map((cfg, idx) => {
          const isActive = idx < activeCount;
          return (
            <IconTile
              key={cfg.id}
              Icon={cfg.Icon}
              isActive={isActive}
              activeClass={cfg.activeClass}
              bgClass={cfg.bgClass}
              tileSizePx={tileSizePx}
              iconPx={resolvedIconPx}
            />
          );
        })}
      </div>

      <ProgressBar value={progress} />
    </div>
  );
}

function IconTile({
  Icon,
  isActive,
  activeClass,
  bgClass,
  tileSizePx,
  iconPx,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  activeClass: string;
  bgClass?: string;
  tileSizePx: number;
  iconPx: number;
}) {
  return (
    <div
      className={[
        "rounded-2xl flex items-center justify-center",
        "transition-all duration-500 ease-out",
        bgClass ?? "bg-gray-100",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_2px_16px_-6px_rgba(0,0,0,0.12)]",
      ].join(" ")}
      style={{ width: tileSizePx, height: tileSizePx }}
    >
      <Icon
        className={[
          "transition-colors duration-500 ease-out",
          isActive ? activeClass : "text-gray-400 grayscale opacity-70",
        ].join(" ")}
        style={{ height: iconPx, width: "auto" }}
        aria-hidden="true"
      />
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-lg">
      <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-sky-500 transition-[width] duration-150 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading {Math.round(value)} percent
      </div>
    </div>
  );
}