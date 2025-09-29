// "use client";

// import { useRef, useLayoutEffect } from "react";
// import { cn } from "@/lib/cn";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

// interface AnimatedCardProps {
//   number: string | number;
//   title: string;
//   description: string;
//   className?: string;
//   tilt?: string; // e.g., rotate-2, -rotate-2 (kept as a base/static tilt)
// }

// const AnimatedCard: React.FC<AnimatedCardProps> = ({
//   number,
//   title,
//   description,
//   className = "",
//   tilt = "",
// }) => {
//   return (
//     <div className="py-4">
//       <div
//         // We animate THIS element (the card) — not the inner text
//         className={cn(
//           `
//           tilt-card relative overflow-hidden rounded-2xl bg-tertiary-orange-500
//           p-8 text-white w-xl transform-gpu will-change-transform
//           `,
//           className,
//           tilt
//         )}
//       >
//         <div className="relative z-10 flex items-start gap-6">
//           {/* Number badge */}
//           <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl hover:border-2 hover:border-white/30 bg-white/10 backdrop-blur-sm">
//             <span className="text-2xl font-semibold">{number}</span>
//           </div>

//           {/* Content */}
//           <div className="flex-1 space-y-3">
//             <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
//             <p className="text-white text-xl font-medium leading-relaxed">
//               {description}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function ValuesSection() {
//   const listRef = useRef<HTMLDivElement | null>(null);

//   useLayoutEffect(() => {
//     // Respect reduced motion
//     if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

//     gsap.registerPlugin(ScrollTrigger);

//     const ctx = gsap.context(() => {
//       const q = gsap.utils.selector(listRef);
//       const cards = q<HTMLElement>(".tilt-card");

//       // Hint GPU and avoid style thrash
//       gsap.set(cards, { willChange: "transform", force3D: true });

//       cards.forEach((card, i) => {
//         const dir = i % 2 === 0 ? 1 : -1; // alternate rotation direction

//         // Randomize per-card motion
//         const yTo = -gsap.utils.random(80, 96);          // translate up between 80–96px
//         const rotDelta = gsap.utils.random(8, 10) * dir; // add 5–8deg based on index
//         const startOffset = gsap.utils.random(0, 15);     // vary start/end a bit for organic feel
//         const endOffset = gsap.utils.random(0, 15);

//         gsap.to(card, {
//           y: yTo,
//           rotation: `-=${rotDelta}`,          // stacks with your Tailwind base tilt
//           transformOrigin: "50% 50%",
//           ease: "none",
//           force3D: true,
//           scrollTrigger: {
//             trigger: card,
//             start: `top bottom-=${startOffset}%`,
//             end: `bottom top+=${endOffset}%`,
//             scrub: 0.6,                       // increase for more smoothing (e.g., 1)
//             fastScrollEnd: true,
//             invalidateOnRefresh: true,
//             // markers: true,
//           },
//         });
//       });
//     }, listRef);

//     return () => ctx.revert();
//   }, []);

//   const values = [
//     {
//       number: "01",
//       title: "Crafting a Morally Friendly Workspace",
//       description:
//         "We’re building a workspace where every worker isn’t just an asset but a vital contributor to our shared vision. At Waysorted, we foster an environment that values collaboration and supports the common goal of turning digital chaos into creative clarity.",
//       tilt: "-rotate-[-1deg]",
//     },
//     {
//       number: "02",
//       title: "A Legacy of Contributors",
//       description:
//         "Our customers, employees, and community are our stakeholders, our partners in progress. We weave their insights into every decision, ensuring Waysorted remains a hub that solves the mysteries of workflow inefficiency, one step at a time.",
//       tilt: "-rotate-[1deg]",
//     },
//     {
//       number: "03",
//       title: " A Zeal for Longevity",
//       description:
//         "Our mission is to deliver top-tier services that stand the test of time. While trends fade, our commitment to consistency and impact endures. We design lasting solutions, tools and platforms that guide creators beyond the moment and into a future of seamless productivity.",
//       tilt: "rotate-[1deg]",
//     },
//     {
//       number: "04",
//       title: "Diversity of Thoughts",
//       description:
//         "We thrive on a vibrant, eclectic brainspace that celebrates variety. At Waysorted, we embrace diverse ideas, perspectives, and approaches, crafting designs and tools that serve not just one, but many—unlocking innovation for every creator in our community.",
//       tilt: "-rotate-[2deg]",
//     },
//   ];

//   return (
//     <section className="tertiary-orange-500-bg-dots px-6 md:px-20 lg:px-32 py-12 orange-cursor hover:orange-cursor">
//       <h2 className="text-8xl font-semibold text-center mb-12 text-tertiary-orange-500">
//         Our Values
//       </h2>

//       <div ref={listRef} className="max-w-xl mx-auto">
//         {values.map((value, index) => (
//           <AnimatedCard
//             key={index}
//             number={value.number}
//             title={value.title}
//             description={value.description}
//             tilt={value.tilt}
//           />
//         ))}
//       </div>
//     </section>
//   );
// }



"use client";
 
import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
 
// Simple stable hash from a string -> 32-bit int
function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
 
// Deterministic PRNG (mulberry32) based on a numeric seed
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
 
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
 
interface AnimatedCardProps {
  number: string | number;
  title: string;
  description: string;
  className?: string;
  direction?: 1 | -1; // 1 or -1 to alternate rotation direction
  // Baseline ranges (will be varied per-card)
  translateMax?: number; // base max px
  rotateMax?: number;    // base max deg
  baseTiltMax?: number;  // base tilt max deg
}
 
function AnimatedCard({
  number,
  title,
  description,
  className = "",
  direction = 1,
  translateMax = 120,
  rotateMax = 10,
  baseTiltMax = 4,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
 
  // Per-card stable randomness based on content
  const rng = useMemo(() => mulberry32(hashString(String(number) + "|" + title)), [number, title]);
 
  // Per-card variation factors
  // Translate variation: 0.65x .. 1.35x
  const tFactor = useMemo(() => lerp(0.65, 1.35, rng()), [rng]);
  // Rotate variation: 0.6x .. 1.6x
  const rFactor = useMemo(() => lerp(0.6, 1.6, rng()), [rng]);
  // Base tilt magnitude: 0.5 .. baseTiltMax, random sign
  const baseTilt = useMemo(() => {
    const mag = lerp(0.5, baseTiltMax, rng());
    const sign = rng() < 0.5 ? -1 : 1;
    return mag * sign;
  }, [rng, baseTiltMax]);
 
  // Scroll progress for this card relative to viewport
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // 0 = when top hits bottom of viewport, 1 = bottom hits top
  });
 
  // Normalize around center: 0.5 -> 0, edges -> ±1
  const norm = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0, -1]);
 
  // Apply per-card translate variation
  const translateY = useTransform(norm, [-1, 1], [-translateMax * tFactor, translateMax * tFactor]);
 
  // Apply per-card rotate variation and alternating direction
  const tiltFromScroll = useTransform(norm, (v) => v * rotateMax * rFactor * direction);
  const rotate = useTransform(tiltFromScroll, (v) => v + baseTilt);
 
  // Spring smoothing
  const smoothY = useSpring(translateY, { stiffness: 120, damping: 20, mass: 0.25 });
  const smoothRotate = useSpring(rotate, { stiffness: 120, damping: 20, mass: 0.25 });
 
  // Reduced motion: static base tilt, no scroll-driven motion
  const motionStyle = reduceMotion
    ? { rotate: baseTilt, y: 0 }
    : { rotate: smoothRotate, y: smoothY };
 
  return (
    <div className="py-2">
      <motion.div
        ref={ref}
        style={motionStyle}
        className={`relative overflow-hidden rounded-2xl bg-tertiary-orange-500 p-8 text-white w-xl transform-gpu will-change-transform ${className}`}
      >
        <div className="relative z-10 flex items-start gap-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl hover:border-2 hover:border-white/30 bg-white/10 backdrop-blur-sm">
            <span className="text-2xl font-semibold">{number}</span>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
            <p className="text-white text-xl font-medium leading-relaxed">{description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
 
export default function ValuesSection() {
  const values = [
    {
      number: "01",
      title: "Crafting a Morally Friendly Workspace",
      description:
        "We’re building a workspace where every worker isn’t just an asset but a vital contributor to our shared vision. At Waysorted, we foster an environment that values collaboration and supports the common goal of turning digital chaos into creative clarity.",
    translate: 120
    },
    {
      number: "02",
      title: "A Legacy of Contributors",
      description:
        "Our customers, employees, and community are our stakeholders, our partners in progress. We weave their insights into every decision, ensuring Waysorted remains a hub that solves the mysteries of workflow inefficiency, one step at a time.",
    translate: 80
    },
    {
      number: "03",
      title: " A Zeal for Longevity",
      description:
        "Our mission is to deliver top-tier services that stand the test of time. While trends fade, our commitment to consistency and impact endures. We design lasting solutions, tools and platforms that guide creators beyond the moment and into a future of seamless productivity.",
    },
    {
      number: "04",
      title: "Diversity of Thoughts",
      description:
        "We thrive on a vibrant, eclectic brainspace that celebrates variety. At Waysorted, we embrace diverse ideas, perspectives, and approaches, crafting designs and tools that serve not just one, but many—unlocking innovation for every creator in our community.",
    },
  ];
 
  return (
    <section className="tertiary-orange-500-bg-dots px-6 md:px-20 lg:px-32 py-12 orange-cursor hover:orange-cursor">
      <h2 className="text-8xl font-semibold text-center mb-12 text-tertiary-orange-500">
        Our Values
      </h2>
 
      <div className="max-w-xl mx-auto">
        {values.map((value, index) => (
          <AnimatedCard
            key={index}
            number={value.number}
            title={value.title}
            description={value.description}
            // Alternate rotation direction
            direction={index % 2 === 0 ? 1 : -1}
            // You can also tweak baseline ranges here if you want
            translateMax={120}
            rotateMax={10}
            baseTiltMax={4}
          />
        ))}
      </div>
    </section>
  );
}
 