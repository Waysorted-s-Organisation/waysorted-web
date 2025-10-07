"use client";
 
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import CommentCard from "@/components/CommentCard";
import { useTypewriter } from "@/hooks/useTypeWriter";
 
gsap.registerPlugin(ScrollTrigger, InertiaPlugin);

 
export default function Comments() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const typedText = useTypewriter(["searching", "hunting", "exploring"]);
  const cardsContainerRef = useRef<HTMLDivElement | null>(null); // container that cards stay inside
  
  useEffect(() => {
    if (!sectionRef.current) return;
 
    // Scroll-synced word animation
 
    // Floating cards over the dedicated cards container
    let oldX = 0,
      oldY = 0;
    let displacedX = 0,
      displacedY = 0;
 
    const handleMouseMove = (e: MouseEvent) => {
      displacedX = e.clientX - oldX;
      displacedY = e.clientY - oldY;
      oldX = e.clientX;
      oldY = e.clientY;
    };
 
    document.addEventListener("mousemove", handleMouseMove);
 
    const bounds = cardsContainerRef.current;
    if (!bounds) return;
 
    // Place cards randomly without overlap on initial load
    const placeCardsWithoutOverlap = () => {
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const padding = 12; // space between cards
      const MAX_TRIES = 500;
 
      cardRefs.current.forEach((card, idx) => {
        if (!card) return;
 
        const w = card.offsetWidth;
        const h = card.offsetHeight;
 
        const maxX = Math.max(0, bounds.clientWidth - w);
        const maxY = Math.max(0, bounds.clientHeight - h);
 
        let x = 0;
        let y = 0;
        let tries = 0;
 
        const overlapsAny = (nx: number, ny: number) => {
          for (const r of placed) {
            const overlap =
              nx < r.x + r.w + padding &&
              nx + w + padding > r.x &&
              ny < r.y + r.h + padding &&
              ny + h + padding > r.y;
            if (overlap) return true;
          }
          return false;
        };
 
        if (maxX === 0 && maxY === 0) {
          x = 0;
          y = 0;
        } else {
          do {
            x = Math.random() * maxX;
            y = Math.random() * maxY;
            tries++;
          } while (overlapsAny(x, y) && tries < MAX_TRIES);
 
          // Fallback to grid-like placement if random attempts fail
          if (tries >= MAX_TRIES) {
            const count = cardRefs.current.filter(Boolean).length;
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const cellW = bounds.clientWidth / cols;
            const cellH = bounds.clientHeight / rows;
            x = Math.min(maxX, col * cellW + Math.max(0, (cellW - w) / 2));
            y = Math.min(maxY, row * cellH + Math.max(0, (cellH - h) / 2));
          }
        }
 
        gsap.set(card, { x, y });
        placed.push({ x, y, w, h });
      });
    };
 
    // Physics: bouncing inside cardsContainerRef
    const friction = -0.55; // negative to invert direction, magnitude < 1 to absorb energy
    const resistance = 280; // higher -> slows down sooner
    const kickScale = 45; // scales the initial velocity on hover
 
    type Cleaner = () => void;
    const cleaners: Cleaner[] = [];
 
    const setupCardPhysics = (card: HTMLDivElement) => {
      // Tracker for current velocity
      const tracker = InertiaPlugin.track(card, "x,y")[0];
      const cardProp = gsap.getProperty(card);
 
      // Current bounds (container size)
      let bw = bounds.clientWidth;
      let bh = bounds.clientHeight;
 
      const handleResize = () => {
        bw = bounds.clientWidth;
        bh = bounds.clientHeight;
      };
      window.addEventListener("resize", handleResize);
      cleaners.push(() => window.removeEventListener("resize", handleResize));
 
      // Bounce animation (doesn't return to any previous position)
      const animateBounce = (
        x: number | string = "+=0",
        y: number | string = "+=0",
        vx: number | "auto" = "auto",
        vy: number | "auto" = "auto"
      ) => {
        gsap.to(card, {
          // When inertia is set with velocity, GSAP drives x/y and we'll clamp/reflect in checkBounds
          inertia: {
            x: typeof vx === "number" ? { velocity: vx, resistance } : "auto",
            y: typeof vy === "number" ? { velocity: vy, resistance } : "auto",
          } as {
            x: { velocity: number; resistance: number } | "auto";
            y: { velocity: number; resistance: number } | "auto";
          },
          x,
          y,
          onUpdate: checkBounds,
          ease: "none",
        });
      };
 
      const checkBounds = () => {
        // Current position and velocity
        const x = Number(cardProp("x") as string | number) || 0;
        const y = Number(cardProp("y") as string | number) || 0;
 
        const w = card.offsetWidth;
        const h = card.offsetHeight;
 
        let vx = tracker.get("x"); // pixels/second
        let vy = tracker.get("y");
 
        let nx = x;
        let ny = y;
 
        let hit = false;
 
        // Right wall
        if (x + w > bw) {
          nx = bw - w;
          vx *= friction;
          hit = true;
        }
        // Left wall
        else if (x < 0) {
          nx = 0;
          vx *= friction;
          hit = true;
        }
 
        // Bottom wall
        if (y + h > bh) {
          ny = bh - h;
          vy *= friction;
          hit = true;
        }
        // Top wall
        else if (y < 0) {
          ny = 0;
          vy *= friction;
          hit = true;
        }
 
        if (hit) {
          // Start a new inertia tween from the collision point with reflected velocities
          gsap.killTweensOf(card);
          animateBounce(nx, ny, vx, vy);
        }
      };
 
      // Kick the card on hover with a velocity based on cursor movement
      const onEnter = () => {
        // Bring to front while it's active
        card.style.zIndex = "20";
        gsap.killTweensOf(card);
 
        const vx = displacedX * kickScale;
        const vy = displacedY * kickScale;
 
        // Start from the current position (+=0) with the "kick" velocities
        animateBounce("+=0", "+=0", vx, vy);
      };
 
      const onLeave = () => {
        // Let physics continue, just lower z-index
        card.style.zIndex = "10";
      };
 
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
 
      cleaners.push(() => {
        gsap.killTweensOf(card);
        InertiaPlugin.untrack(card, "x,y");
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
      });
    };
 
    // Ensure DOM has rendered/sized before measuring/placing
    requestAnimationFrame(() => {
      placeCardsWithoutOverlap();
      // Initialize physics for each card
      cardRefs.current.forEach((card) => card && setupCardPhysics(card));
    });
 
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      cleaners.forEach((c) => c());
    };
  }, []);
 
  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white flex flex-col items-center justify-center text-center py-40 overflow-hidden"
    >
      {/* Wrap blue block and overlay a positioned container for the floating cards */}
      <div className="relative w-full max-w-6xl mx-auto">
        <div className="bg-dots rounded-3xl text-white relative z-0 w-full">
          <section className="mx-auto max-w-5xl px-8 py-14 flex flex-col items-center">
            <p className="text-white font-normal text-3xl md:text-6xl leading-tight text-center">
              <span>Creators spend </span>
              <span className="inline-block align-middle border-2 border-white/80 px-4 py-2 rounded-full animate-pulse whitespace-nowrap">
                {typedText}
              </span>
              <span className="block mt-3">
                100+ tools daily than creating.
              </span>
            </p>

            <button
              className="mt-10 bg-secondary-db-100 tool-hunt text-white font-semibold text-base rounded-xl py-3 px-7 border border-white/20 cursor-pointer"
              type="button"
            >
              End the Tool Hunt.
            </button>
          </section>
        </div>
 
        {/* Cards container overlays the blue block exactly */}
        <div
          ref={cardsContainerRef}
          className="absolute -inset-0 z-10 pointer-events-none"
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              ref={(el) => {
                if (el) cardRefs.current[idx] = el;
              }}
              // Left/top 0 ensures GSAP's x/y are relative to container's top-left
              className="absolute left-0 top-0 will-change-transform pointer-events-auto"
              style={{ zIndex: 10 }}
            >
              <CommentCard
                username={`User ${idx + 1}`}
                role="Figma User"
                comment="Floating comment!"
                avatarSrc="/path/to/avatar.jpg"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 