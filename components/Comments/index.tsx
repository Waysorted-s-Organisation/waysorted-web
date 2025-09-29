"use client";
 
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import CommentCard from "@/components/CommentCard";
 
gsap.registerPlugin(ScrollTrigger, InertiaPlugin);

 
export default function Comments() {
  const wordsRefs = useRef<HTMLSpanElement[]>([]);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const cardsContainerRef = useRef<HTMLDivElement | null>(null); // container that cards stay inside
 
  const VISION_STATEMENT =
    "Designers juggle 100+ tools weekly, wasting time switching and searching perfect tools. Waysorted tackle the chaotic workflow...";
 
  useEffect(() => {
    if (!sectionRef.current || wordsRefs.current.length === 0) return;
 
    // Scroll-synced word animation
    gsap.set(wordsRefs.current, { opacity: 0 });
 
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 50%",
        end: "bottom 90%",
        scrub: 1,
        markers: false,
        invalidateOnRefresh: true,
      },
    });
 
    masterTimeline
      .to(wordsRefs.current, { opacity: 0.2, duration: 1, stagger: 0.15, ease: "power3.out" })
      .to(wordsRefs.current, { opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out" }, 0.5);
 
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
      masterTimeline.kill();
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
        {/* Background text (blue block) */}
        <div className="bg-blue-500 rounded-3xl text-white relative z-0 w-full">
          <p className="text-white font-normal text-2xl leading-relaxed py-35 px-35">
            {VISION_STATEMENT.split(" ").map((word, index) => (
              <span
                key={`word-${index}`}
                ref={(el) => {
                  if (el) wordsRefs.current[index] = el;
                }}
                className="inline-block mx-1"
              >
                {word}
              </span>
            ))}
          </p>
        </div>
 
        {/* Cards container overlays the blue block exactly */}
        <div
          ref={cardsContainerRef}
          className="absolute -inset-5 z-10"
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              ref={(el) => {
                if (el) cardRefs.current[idx] = el;
              }}
              // Left/top 0 ensures GSAP's x/y are relative to container's top-left
              className="absolute left-0 top-0 will-change-transform"
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
 