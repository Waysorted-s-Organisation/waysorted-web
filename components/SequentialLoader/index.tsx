"use client";

import * as React from "react";

export type IconDef = {
  id: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeClass: string;
  bgClass?: string;
  iconPx?: number;
};

type Props = {
  icons: IconDef[];
  estimatedMs?: number;
  className?: string;
  onDone?: () => void;

  // Desktop sizes
  tileSizePx?: number;
  iconPx?: number;

  mobileTileSizePx?: number;
  mobileIconPx?: number;
};

export default function SequentialLogoLoader({
  icons,
  estimatedMs = 2000,
  className,
  onDone,
  tileSizePx = 64,
  iconPx,
  mobileTileSizePx,
  mobileIconPx,
}: Props) {
  const [progress, setProgress] = React.useState(0);

  // Defaults
  const resolvedIconPx = iconPx ?? Math.round(tileSizePx * 0.5);
  // Default mobile to 100px tile if not set, or smaller relative to desktop
  const resolvedMobileTilePx = mobileTileSizePx ?? 100; 
  const resolvedMobileIconPx = mobileIconPx ?? Math.round(resolvedMobileTilePx * 0.5);

  React.useEffect(() => {
    const stepMs = Math.max(10, Math.floor(estimatedMs / 100));
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
    <div
      className={["flex flex-col items-center gap-8", className]
        .filter(Boolean)
        .join(" ")}
      // We pass CSS variables for the sizes so we can switch them with media queries
      style={
        {
          "--tile-size": `${tileSizePx}px`,
          "--icon-size": `${resolvedIconPx}px`,
          "--mob-tile-size": `${resolvedMobileTilePx}px`,
          "--mob-icon-size": `${resolvedMobileIconPx}px`,
        } as React.CSSProperties
      }
    >
      {/* 
        Layout: 
        - Mobile: grid-cols-2 (2x2 matrix)
        - Desktop (md): flex-row
      */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-6">
        {icons.map((cfg, idx) => {
          const isActive = idx < activeCount;
          return (
            <IconTile
              key={cfg.id}
              Icon={cfg.Icon}
              isActive={isActive}
              activeClass={cfg.activeClass}
              bgClass={cfg.bgClass}
            />
          );
        })}
      </div>
    </div>
  );
}

function IconTile({
  Icon,
  isActive,
  activeClass,
  bgClass,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  activeClass: string;
  bgClass?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl flex items-center justify-center",
        "transition-all duration-500 ease-out",
        bgClass ?? "bg-gray-100",
        isActive? activeClass : "grayscale opacity-50",
        "w-[var(--mob-tile-size)] h-[var(--mob-tile-size)] md:w-[var(--tile-size)] md:h-[var(--tile-size)]",
      ].join(" ")}
    >
      <Icon
        className={[
          "transition-colors duration-500 ease-out",
          isActive ? activeClass : "text-gray-400 grayscale opacity-70",
          "w-[var(--mob-icon-size)] h-var(--mob-icon-size)] md:w-[var(--icon-size)] md:h-[var(--icon-size)]"
        ].join(" ")}
      />
    </div>
  );
}