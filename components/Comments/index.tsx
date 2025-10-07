"use client";
 
import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTypewriter } from "@/hooks/useTypeWriter";

type CardState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
};

const CARD_COUNT = 12;
const CARD_WIDTH = 240;
const CARD_HEIGHT = 160;
const PADDING = 12;
const BOUNCE = 0.9; // Elasticity for wall/collision


 
export default function Comments() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const typedText = useTypewriter(["searching", "hunting", "exploring"]);
  const cardsContainerRef = useRef<HTMLDivElement | null>(null); // container that cards stay inside
  
  const cardStates = useRef<CardState[]>([]);

  // Track last mouse position for "kick" on hover
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const bounds = cardsContainerRef.current;
    if (!bounds) return;

    const boundaryPadding = 20; // or whatever
    const bw = bounds.clientWidth + boundaryPadding;
    const bh = bounds.clientHeight + boundaryPadding;

    // Initialize card positions and velocities
    cardStates.current = [];
    for (let i = 0; i < CARD_COUNT; i++) {
      // Random non-overlapping placement (simple version)
      let tries = 0;
      let x = 0;
      let y = 0;
      let safe = false;
      while (!safe && tries < 1000) {
        x = Math.random() * (bw - CARD_WIDTH);
        y = Math.random() * (bh - CARD_HEIGHT);
        safe = true;
        for (let j = 0; j < i; j++) {
          const c = cardStates.current[j];
          if (
            Math.abs(x - c.x) < CARD_WIDTH + PADDING &&
            Math.abs(y - c.y) < CARD_HEIGHT + PADDING
          ) {
            safe = false;
            break;
          }
        }
        tries++;
      }
      cardStates.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.2, //initial small random velocity
        vy: (Math.random() - 0.5) * 0.2, //initial small random velocity
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
      });
    }
    // Initial DOM positions
    cardRefs.current.forEach((card, i) => {
      if (card) {
        card.style.transform = `translate(${cardStates.current[i].x}px, ${cardStates.current[i].y}px)`;
      }
    });

    let animId = 0;
    const update = () => {
      // Physics step
      for (let i = 0; i < CARD_COUNT; i++) {
        const state = cardStates.current[i];

        // Move by velocity
        state.x += state.vx;
        state.y += state.vy;

        // Wall collisions (AABB)
        if (state.x < 0) {
          state.x = 0;
          state.vx *= -BOUNCE;
        }
        if (state.x + CARD_WIDTH > bw) {
          state.x = bw - CARD_WIDTH;
          state.vx *= -BOUNCE;
        }
        if (state.y < 0) {
          state.y = 0;
          state.vy *= -BOUNCE;
        }
        if (state.y + CARD_HEIGHT > bh) {
          state.y = bh - CARD_HEIGHT;
          state.vy *= -BOUNCE;
        }
        state.vx *= 0.98; // Friction
        state.vy *= 0.98; // Friction
      }
      // Card<->card collision detection and resolution
      for (let i = 0; i < CARD_COUNT; i++) {
        for (let j = i + 1; j < CARD_COUNT; j++) {
          const a = cardStates.current[i];
          const b = cardStates.current[j];
          if (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
          ) {
            // Overlap detected, resolve
            // Calculate overlap on x and y
            const dx = (a.x + a.w / 2) - (b.x + b.w / 2);
            const dy = (a.y + a.h / 2) - (b.y + b.h / 2);
            const overlapX = a.w / 2 + b.w / 2 - Math.abs(dx);
            const overlapY = a.h / 2 + b.h / 2 - Math.abs(dy);
            if (overlapX > 0 && overlapY > 0) {
              // Push both cards away along the minimal axis
              if (overlapX < overlapY) {
                const shift = overlapX / 2;
                if (dx > 0) {
                  a.x += shift;
                  b.x -= shift;
                } else {
                  a.x -= shift;
                  b.x += shift;
                }
                // Exchange vx (elastic collision)
                const vxa = a.vx;
                a.vx = b.vx * BOUNCE;
                b.vx = vxa * BOUNCE;
              } else {
                const shift = overlapY / 2;
                if (dy > 0) {
                  a.y += shift;
                  b.y -= shift;
                } else {
                  a.y -= shift;
                  b.y += shift;
                }
                // Exchange vy (elastic collision)
                const vya = a.vy;
                a.vy = b.vy * BOUNCE;
                b.vy = vya * BOUNCE;
              }
            }
          }
        }
      }
      // Update DOM
      cardRefs.current.forEach((card, i) => {
        if (card) {
          const st = cardStates.current[i];
          card.style.transform = `translate(${st.x}px, ${st.y}px)`;
        }
      });
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);

    // Mouse "kick" on hover
    const onPointerMove = (e: MouseEvent) => {
      lastPointer.current.x = e.clientX;
      lastPointer.current.y = e.clientY;
    };
    document.addEventListener("mousemove", onPointerMove);

    // For each card, handle mouseenter to "kick"
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const onEnter = () => {
        // Assign a velocity based on pointer direction
        const st = cardStates.current[i];
        // Just use random direction if no movement
        const dx = (lastPointer.current.x - (st.x + CARD_WIDTH / 2)) || (Math.random() - 0.5);
        const dy = (lastPointer.current.y - (st.y + CARD_HEIGHT / 2)) || (Math.random() - 0.5);
        const speed = 13 + Math.random() * 3; // random speed boost
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        st.vx += (dx / length) * speed;
        st.vy += (dy / length) * speed;
        card.style.zIndex = "20";
      };
      const onLeave = () => {
        card.style.zIndex = "10";
      };
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
    });

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", onPointerMove);
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.replaceWith(card.cloneNode(true)); // removes listeners
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          className="absolute -inset-40 z-10 pointer-events-none"
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
              <Image
                src={`/icons/comment-card-${(idx + 1)}.svg`}
                alt="User comment"
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="w-60 h-40 object-cover rounded-xl"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 