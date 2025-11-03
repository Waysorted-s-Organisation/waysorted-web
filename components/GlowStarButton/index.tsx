import React, { useEffect, useMemo, useState } from "react";

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
  starCount?: number;          // number of stars (default 20)
  randomSeed?: string;         // base seed; default "glow-stars-v2"
  rerollOnHover?: boolean;     // new layout each hover (default false)
  randomizeOnMount?: boolean;  // new layout each page load (default false)
  delayJitter?: number;        // ±seconds random entrance delay jitter (default 0.12)
  enterDurationSec?: number;   // entrance duration in seconds (default 0.45)
  title?: string;              // Optional button title
  "aria-label"?: string;       // Optional aria label
  onClick?: React.MouseEventHandler<HTMLButtonElement>; // Optional click handler
};

export default function GlowStarButton({
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
  ...props
}: Props) {
  const [hoverKey, setHoverKey] = useState(0);
  const [mountNonce, setMountNonce] = useState<string>("");

  useEffect(() => {
    if (randomizeOnMount) {
      setMountNonce(makeNonce());
    }
  }, [randomizeOnMount]);

  const seedBase = randomizeOnMount && mountNonce ? `${randomSeed}-${mountNonce}` : randomSeed;
  const effectiveSeed = rerollOnHover ? `${seedBase}-${hoverKey}` : seedBase;

  const stars = useMemo(() => {
    const minX = 8, maxX = 92;
    const minY = 18, maxY = 86;
    const deadLeft = 36, deadRight = 64;
    const deadTop = 44, deadBottom = 60;

    const arr = [];
    for (let i = 0; i < starCount; i++) {
      const r = rngForIndex(effectiveSeed, i);

      let left = minX + r() * (maxX - minX);
      let top = minY + r() * (maxY - minY);

      if (left > deadLeft && left < deadRight && top > deadTop && top < deadBottom) {
        const pushDirX = r() < 0.5 ? -1 : 1;
        const pushDirY = r() < 0.5 ? -1 : 1;
        left += pushDirX * (10 + r() * 8);
        top += pushDirY * (8 + r() * 6);
        left = Math.min(maxX, Math.max(minX, left));
        top = Math.min(maxY, Math.max(minY, top));
      }

      const size = 5 + Math.round(r() * 5);
      const scale = 0.85 + r() * 0.35;
      const dx = 2 + Math.round(r() * 3);
      const dy = 2 + Math.round(r() * 2);
      const spin = 8 + Math.round(r() * 8);
      const durMs = 1600 + Math.round(r() * 900);

      const base = i * 0.035;
      const jitter = (r() - 0.5) * 2 * delayJitter;
      const enterDelay = Math.max(0, base + jitter);

      arr.push({ left, top, size, scale, dx, dy, spin, durMs, enterDelay });
    }
    return arr;
  }, [effectiveSeed, starCount, delayJitter]);

  return (
    <button
      type="submit"
      className={`btn-glow bg-secondary-db-100 text-white ${className}`}
      onMouseEnter={rerollOnHover ? () => setHoverKey((k) => k + 1) : undefined}
      onTouchStart={rerollOnHover ? () => setHoverKey((k) => k + 1) : undefined}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}
    >
      <span className="btn-inner">{children}</span>
      {stars.map((s, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="btn-star"
          style={
            {
              "--top": `${s.top}%`,
              "--left": `${s.left}%`,
              "--size": `${s.size}px`,
              "--scale": s.scale,
              "--dx": `${s.dx}px`,
              "--dy": `${s.dy}px`,
              "--spin": `${s.spin}deg`,
              "--dur": `${s.durMs}ms`,
              "--enter-delay": `${s.enterDelay}s`,
              "--delay": `${s.enterDelay}s`, // fallback for older CSS
              "--enter-dur": `${enterDurationSec}s`,
              "--rot": "0deg",
            } as React.CSSProperties
          }
        >
          <path
            fill="currentColor"
            d="M12 2.5l2.4 5.2 5.8.5-4.4 3.7 1.4 5.4L12 14.7 6.8 17.3l1.4-5.4-4.4-3.7 5.8-.5L12 2.5z"
          />
        </svg>
      ))}
    </button>
  );
}