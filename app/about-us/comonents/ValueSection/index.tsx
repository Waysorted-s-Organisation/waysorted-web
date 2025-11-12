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
  direction?: 1 | -1;
  translateMax?: number;
  rotateMax?: number;
  baseTiltMax?: number;
}

// Responsive Animated Card
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
  const tFactor = useMemo(() => lerp(0.65, 1.35, rng()), [rng]);
  const rFactor = useMemo(() => lerp(0.6, 1.6, rng()), [rng]);
  const baseTilt = useMemo(() => {
    const mag = lerp(0.5, baseTiltMax, rng());
    const sign = rng() < 0.5 ? -1 : 1;
    return mag * sign;
  }, [rng, baseTiltMax]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const norm = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0, -1]);
  const translateY = useTransform(norm, [-1, 1], [-translateMax * tFactor, translateMax * tFactor]);
  const tiltFromScroll = useTransform(norm, (v) => v * rotateMax * rFactor * direction);
  const rotate = useTransform(tiltFromScroll, (v) => v + baseTilt);

  const smoothY = useSpring(translateY, { stiffness: 120, damping: 20, mass: 0.25 });
  const smoothRotate = useSpring(rotate, { stiffness: 120, damping: 20, mass: 0.25 });

  const motionStyle = reduceMotion
    ? { rotate: baseTilt, y: 0 }
    : { rotate: smoothRotate, y: smoothY };

  // Responsive: For <md, make card full width & text smaller, padding tighter, number badge smaller
  // Tailwind: use 'md:' for md+; default for mobile
  return (
    <div className="py-2">
      <motion.div
        ref={ref}
        style={motionStyle}
        className={`
          relative overflow-hidden rounded-2xl bg-tertiary-orange-500
          p-4 text-white w-full max-w-full transform-gpu will-change-transform
          flex flex-col
          md:p-8 md:w-2xl
          ${className}
        `}
      >
        <div className="relative z-10 flex items-start gap-4 md:gap-6">
          <div className="
            flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center
            rounded-xl outline-1 outline:white/40 bg-white/10 backdrop-blur-sm
          ">
            <span className="text-xl md:text-2xl font-semibold">{number}</span>
          </div>
          <div className="flex-1 space-y-2 md:space-y-3">
            <h3 className="text-lg md:text-2xl font-semibold leading-tight">{title}</h3>
            <p className="text-white text-base md:text-xl font-medium leading-relaxed">{description}</p>
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
    <section className="tertiary-orange-500-bg-dots px-4 md:px-20 lg:px-32 py-8 md:py-12 orange-cursor hover:orange-cursor">
      <h2 className="text-5xl md:text-8xl font-semibold text-center mb-8 md:mb-12 text-tertiary-orange-500">
        Our Values
      </h2>

      <div className="max-w-full md:max-w-xl mx-auto">
        {values.map((value, index) => (
          <AnimatedCard
            key={index}
            number={value.number}
            title={value.title}
            description={value.description}
            direction={index % 2 === 0 ? 1 : -1}
            translateMax={120}
            rotateMax={10}
            baseTiltMax={4}
          />
        ))}
      </div>
    </section>
  );
}