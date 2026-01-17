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
  const rng = useMemo(() => mulberry32(hashString("|" + title)), [title]);

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
          relative overflow-hidden bg-white
          p-4 text-secondary-db-100 transform-gpu will-change-transform
          flex flex-col
          mx-auto
          md:p-8 md:w-lg
          ${className}
        `}
      >
        <div className="relative z-10 flex gap-4 md:gap-6">
          <div className="flex-1 space-y-2 md:space-y-3">
            <h3 className="text-lg md:text-2xl font-semibold leading-tight">{title}</h3>
            <p className="text-secondary-db-100 text-xs md:text-sm font-semibold leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ValuesSection() {
  const values = [
    {
      title: "Building an Ethical and Inclusive Workplace",
      description:
        "We build an ethical, inclusive workplace where every individual is valued and empowered to contribute meaningfully. Collaboration, respect, and transparency guide how we work.",
      translate: 120
    },
    {
      title: "A Zeal for Longevity",
      description:
        "We create reliable, long-lasting tools that go beyond trends. Waysorted focuses on sustainable design solutions that support creators today and into the future.",
      translate: 80
    },
    {
      title: "Diversity of Thoughts",
      description:
        `Waysorted fosters a diverse creative environment that embraces multiple ideas and perspectives.\n\nOur user-centric tools empower creators and teams to unlock productivity and creativity across digital design workflows.`,
      translate: 100
    },
    {
      title: "A Legacy of Contributors",
      description: "Our users, employees, and community are the foundation of our success.\n\nTheir insights shape our decisions and help us continuously improve design workflows.",
      translate: 100
    }
  ];

  return (
    <section className="tertiary-orange-600-bg-dots px-4 md:px-20 lg:px-32 py-8 md:py-12 orange-cursor hover:orange-cursor">
      <h2 className="text-4xl md:text-7xl font-semibold text-start mb-8 md:mb-12 text-white">
        Our Values
      </h2>

      <div className="max-w-full md:max-w-2xl mx-auto">
        {values.map((value, index) => (
          <AnimatedCard
            key={index}
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