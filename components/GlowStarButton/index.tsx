import React, { memo, useEffect, useMemo, useState } from "react";

/* Deterministic PRNG so SSR/CSR can be stable when desired */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i);
  return h >>> 0;
}
function rngForIndex(seed: string, i: number) {
  const base = hashString(seed);
  const mixed = (base ^ Math.imul(i + 1, 0x9e3779b9)) >>> 0;
  return mulberry32(mixed);
}
function makeNonce() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0].toString(36);
  }
  return Math.random().toString(36).slice(2);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  className?: string;
  starCount?: number;          // number of dots (kept name for compatibility)
  randomSeed?: string;
  rerollOnHover?: boolean;
  randomizeOnMount?: boolean;
  delayJitter?: number;
  enterDurationSec?: number;
  title?: string;
  "aria-label"?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  bgColor?: string; // New prop for background color
  bottomOnly?: boolean; // Restrict glow dots to the bottom edge
};

function GlowStarButton({
  children = "Start Instantly!",
  className = "",
  starCount = 20,
  randomSeed = "glow-stars-v2",
  rerollOnHover = false,
  randomizeOnMount = false,
  delayJitter = 0.12,
  enterDurationSec = 0.45,
  title,
  "aria-label": ariaLabel,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onTouchStart,
  bgColor = "secondary-db-100", // Default value for bgColor
  bottomOnly = false,
  ...props
}: Props) {
  const [hoverKey, setHoverKey] = useState(0);
  const [mountNonce, setMountNonce] = useState<string>("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (randomizeOnMount) {
      setMountNonce(makeNonce());
    }
  }, [randomizeOnMount]);

  const seedBase = randomizeOnMount && mountNonce ? `${randomSeed}-${mountNonce}` : randomSeed;
  const effectiveSeed = rerollOnHover ? `${seedBase}-${hoverKey}` : seedBase;

  const dots = useMemo(() => {
    const minX = 6, maxX = 94;
    const deadLeft = 36, deadRight = 64;
    const deadTop = 44, deadBottom = 60;
    const colWidth = (maxX - minX) / starCount;

    const arr: {
      left: number;
      topDefault: number;
      topHover: number;
      size: number;
      scale: number;
      dx: number;
      dy: number;
      spin: number;
      durMs: number;
      enterDelay: number;
      radius: number;
    }[] = [];
    for (let i = 0; i < starCount; i++) {
      const r = rngForIndex(effectiveSeed, i);

      // Stratified X-coordinate to ensure natural uniform distribution without clumping
      const colStart = minX + i * colWidth;
      const left = colStart + r() * colWidth;
      const topDefault = 83 + r() * 7; // Concentrated at bottom (83% - 90%)
      
      let topHover = 18 + r() * 64; // Spread all over Y (18% - 82%)
      if (bottomOnly) {
        topHover = topDefault; // If bottomOnly, they stay at the bottom even on hover
      } else {
        // Push away from center zone on hover
        if (left > deadLeft && left < deadRight && topHover > deadTop && topHover < deadBottom) {
          const pushDirY = r() < 0.5 ? -1 : 1;
          topHover += pushDirY * (8 + r() * 6);
          topHover = Math.min(82, Math.max(18, topHover));
        }
      }

      const size = 5 + Math.round(r() * 5); // used for external width/height
      const scale = 0.85 + r() * 0.35;
      const dx = 2 + Math.round(r() * 3);
      const dy = 2 + Math.round(r() * 2);
      // Dots don’t need spin; set to 0 (kept var so CSS need not change)
      const spin = 0;
      const durMs = 1600 + Math.round(r() * 900);
      const base = i * 0.035;
      const jitter = (r() - 0.5) * 2 * delayJitter;
      const enterDelay = Math.max(0, base + jitter);
      const radius = 4; // You can vary: 8 + Math.round(r() * 4)

      arr.push({ left, topDefault, topHover, size, scale, dx, dy, spin, durMs, enterDelay, radius });
    }
    return arr;
  }, [effectiveSeed, starCount, delayJitter, bottomOnly]);

  return (
    <button
      type="submit"
      className={`btn-glow text-white ${bgColor} ${className} group`} // Added bgColor with default value and group for overlay transition
      onMouseEnter={(event) => {
        setIsActive(true);
        if (rerollOnHover) setHoverKey((key) => key + 1);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setIsActive(false);
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        setIsActive(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsActive(false);
        onBlur?.(event);
      }}
      onTouchStart={(event) => {
        setIsActive(true);
        if (rerollOnHover) setHoverKey((key) => key + 1);
        onTouchStart?.(event);
      }}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}
    >
      <span className="btn-inner">{children}</span>
      
      {/* Bottom white gradient inside the button */}
      <div className={`absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t to-transparent pointer-events-none transition-all duration-300 ${
        isActive ? "from-white/20" : "from-white/12"
      }`} />
      
      {dots.map((d, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="btn-star"
          style={
            {
              "--top-default": `${d.topDefault}%`,
              "--top-hover": `${d.topHover}%`,
              "--left": `${d.left}%`,
              "--size": `${d.size}px`,
              "--scale": d.scale,
              "--dx": `${d.dx}px`,
              "--dy": `${d.dy}px`,
              "--spin": `${d.spin}deg`,
              "--dur": `${d.durMs}ms`,
              "--enter-delay": `${d.enterDelay}s`,
              "--delay": `${d.enterDelay}s`,
              "--enter-dur": `${enterDurationSec}s`,
              "--rot": "0deg",
            } as React.CSSProperties
          }
        >
          <circle cx="12" cy="12" r={d.radius} fill="currentColor" />
        </svg>
      ))}
    </button>
  );
}

export default memo(GlowStarButton);
