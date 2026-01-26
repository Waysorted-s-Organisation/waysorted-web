"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue, animate, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

// --- Component 1: Segmented Progress Bar (Automatic Loop) ---
export function SegmentedProgressBar() {
  const controls = useAnimation();
  const [progress, setProgress] = useState<number>(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.5 });

  const totalBars = 15;
  const targetPercent = 72;
  const activeBars = Math.round((targetPercent / 100) * totalBars);

  useEffect(() => {
    if (!isInView) return;

    let isMounted = true;

    const runAnimation = async () => {
      if (!isMounted) return;

      // 1. Reset State
      setProgress(0);
      await controls.start({
        opacity: 0.2,
        transition: { duration: 0.5 } // Fade out smoothly before resetting
      });

      // 2. Animate Counter
      let count = 0;
      // We use a small promise-based delay loop for the counter to sync loosely with bars
      const countDuration = 1000; // 1 second to count up
      const stepTime = countDuration / targetPercent;

      const counterInterval = setInterval(() => {
        if (!isMounted) return;
        count += 1;
        setProgress((prev) => (prev < targetPercent ? count : targetPercent));
        if (count >= targetPercent) clearInterval(counterInterval);
      }, stepTime);

      // 3. Animate Bars Filling
      await controls.start((i: number) => ({
        opacity: i < activeBars ? 1 : 0.2,
        transition: {
          duration: 0.3,
          delay: i * 0.05, // Stagger effect
          ease: "linear",
        },
      }));

      // 4. Hold the finished state, then restart
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) runAnimation();
        }, 3000); // Hold for 3 seconds before looping
      }
    };

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, [controls, activeBars, targetPercent, isInView]);

  return (
    <div ref={containerRef} className="flex items-center gap-4">
      {/* Percentage Display */}
      <span className="w-14 text-3xl font-bold text-black">{progress}%</span>

      {/* Segmented Bar Container */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalBars }).map((_, idx) => (
          <motion.div
            key={idx}
            custom={idx}
            initial={{ opacity: 0.2 }}
            animate={controls}
            className="w-[8.51px] h-[38.31px] rounded-md bg-[#ff7920]"
          />
        ))}
      </div>
    </div>
  );
}

// --- Component 2: Arc Bars (Automatic Loop) ---
interface ArcBarsProps {
  percentage: number;
  targetNumber: number;
}

const ArcBars: React.FC<ArcBarsProps> = ({ percentage, targetNumber }) => {
  const totalBars = 19;
  const barsLit = Math.round((percentage / 100) * totalBars);
  const centerX = 150;
  const centerY = 150;
  const innerRadius = 100;

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.5 });

  // Replaced hover state with an automatic "active" toggle
  const [isActive, setIsActive] = useState(false);

  // Motion value for animating the center number
  const count = useMotionValue(0);
  const [displayCount, setDisplayCount] = useState(0);

  // Cycle the "active" state automatically
  useEffect(() => {
    if (!isInView) {
      setIsActive(false);
      return;
    }
    // Start active immediately
    setIsActive(true);

    const interval = setInterval(() => {
      setIsActive((prev) => !prev);
    }, 3000); // Toggle every 3 seconds (3s ON, 3s OFF)

    return () => clearInterval(interval);
  }, [isInView]);

  // Update number display
  useEffect(() => {
    const unsubscribe = count.on("change", (latest) => {
      setDisplayCount(Math.round(latest));
    });
    return () => unsubscribe();
  }, [count]);

  // Animate count based on active state
  useEffect(() => {
    const controls = animate(count, isActive ? targetNumber : 0, {
      duration: 1, // Slower duration for smoother auto-play
      ease: "easeInOut",
    });
    return controls.stop;
  }, [isActive, targetNumber, count]);

  return (
    <div ref={containerRef} className="absolute -top-[25%] left-1/2 transform -translate-x-1/2">
      <motion.svg className="w-72 h-72" viewBox="0 0 300 300">
        {/* Center number */}
        <motion.text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="#111"
          fontSize="41.58"
          fontWeight="bold"
        >
          {displayCount}x
        </motion.text>

        {/* Bars around the top half-circle */}
        {Array.from({ length: totalBars }).map((_, i) => {
          const angleOnCircle = (180 * (totalBars - 1 - i)) / (totalBars - 1);
          const groupRotation = 90 - angleOnCircle;

          // Stagger delay based on active state
          const delay = isActive
            ? i * 0.04
            : i < barsLit
              ? (barsLit - 1 - i) * 0.04
              : 0;

          return (
            <g
              key={i}
              transform={`translate(${centerX} ${centerY}) rotate(${groupRotation}) translate(0 ${-innerRadius})`}
            >
              <motion.path
                d="M0.104279 1.66846C0.0477705 0.764328 0.765818 0 1.67171 0H10.8922C11.7981 0 12.5162 0.764327 12.4597 1.66846L11.0855 23.6553C11.0337 24.483 10.3474 25.1279 9.51804 25.1279H3.04589C2.21657 25.1279 1.53019 24.483 1.47846 23.6553L0.104279 1.66846Z"
                rx={1.57}
                ry={1.57}
                fill="#47c784"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: isActive && i < barsLit ? 1 : 0.2 }}
                transition={{ duration: 0.5, delay }}
              />
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
};

// --- Component 3: Info Card (Wrapper) ---
interface CardProps {
  title: string;
  description: string;
  idx: number;
}

const InfoCard: React.FC<CardProps> = ({ title, description, idx }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { amount: 0.3 });

  // GSAP Animation for the Network Graph (Index 1)
  useGSAP(() => {
    if (idx !== 1 || !isInView) return; // Only run GSAP for the second card when in view

    gsap.registerPlugin();
    const tl = gsap.timeline({ repeat: -1, ease: "linear" });

    tl.fromTo(
      ".vertical-line",
      { scaleY: 0, transformOrigin: "top" },
      { scaleY: 0.8, opacity: 1, duration: 3 }
    );

    tl.fromTo(
      ".node3",
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      ">"
    );
    tl.fromTo(
      ".node_outer3",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      ">"
    );

    tl.fromTo(
      ".left-horizontal-line",
      { scaleX: 0, transformOrigin: "left" },
      {
        scaleX: 1,
        opacity: 1,
        duration: 4,
        ease: "linear",
        keyframes: [
          { scaleX: 0.6, duration: 1 },
          { scaleX: 0.6, duration: 1 },
          { scaleX: 1, duration: 1 },
        ],
      },
      ">"
    );
    tl.fromTo(
      ".right-horizontal-line",
      { scaleX: 0, opacity: 0, transformOrigin: "right" },
      {
        scaleX: 1,
        opacity: 1,
        duration: 4,
        ease: "linear",
        keyframes: [
          { scaleX: 0.6, duration: 1 },
          { scaleX: 0.6, duration: 1 },
          { scaleX: 1, duration: 1 },
        ],
      },
      "<"
    );

    // Node 2 & 4
    tl.fromTo(
      [".node2", ".node4"],
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      6.6
    );
    tl.fromTo(
      [".node_outer2", ".node_outer4"],
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      6.6
    );

    // Node 1 & 5
    tl.fromTo(
      [".node1", ".node5"],
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      8.6
    );
    tl.fromTo(
      [".node_outer1", ".node_outer5"],
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      8.6
    );

    return () => {
      tl.kill();
    };
  }, { scope: cardRef, dependencies: [isInView] });

  return (
    <div ref={cardRef} className="w-[306px] h-[255px] border border-secondary-db-5 rounded-xl flex flex-col bg-white p-2">
      {/* Visual Section */}
      {idx === 0 && (
        <div className="h-[140.32px] rounded-t-xl flex items-center justify-center bg-[#FF7920]/5">
          <SegmentedProgressBar />
        </div>
      )}

      {idx === 1 && (
        <div className="h-[140.32px] relative rounded-t-xl flex items-center justify-center bg-[#F8F5FF]">
          <div className="flex flex-col gap-4 items-center">
            {/* Tree Graph DOM Structure */}
            <div className="node_outer relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
              <div className="node w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]">
                <div className="vertical-line absolute left-1/2 transform -translate-x-1/2 w-[2px] h-[70px] bg-[#7531F9] opacity-0"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="node_outer1 relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
                <div className="node1 w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]"></div>
              </div>
              <div className="node_outer2 relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
                <div className="node2 w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]"></div>
              </div>
              <div className="node_outer3 relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
                <div className="relative3 node w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]">
                  <div className="left-horizontal-line absolute top-1/2 left-[9px] w-[90px] h-[2px] bg-[#7531F9]"></div>
                  <div className="right-horizontal-line absolute top-1/2 right-[9px] w-[90px] h-[2px] bg-[#7531F9]"></div>
                </div>
              </div>
              <div className="node_outer4 relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
                <div className="node4 w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]"></div>
              </div>
              <div className="node_outer5 relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
                <div className="node5 w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {idx === 2 && (
        <div className="h-[140.32px] rounded-t-xl flex items-center justify-center bg-[#47C784]/5 relative">
          <ArcBars targetNumber={10} percentage={70} />
        </div>
      )}

      {/* Text Section */}
      <div className="h-[81.98px] p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-lg text-secondary-db-100 mb-1">
          {title}
        </h3>
        <p className="text-[13px] text-secondary-db-70 leading-4">
          {description}
        </p>
      </div>
    </div>
  );
};

// --- Main App Component ---
export const InfoCards = () => {
  const cardData = [
    {
      title: "Increase in Productivity",
      description:
        "Users reported completing tasks 30% faster after switching to Waysorted plugin bundles.",
      idx: 0,
    },
    {
      title: "Users recommend us",
      description:
        "Because great tools shouldn't slow you down, they should sort you out.",
      idx: 1,
    },
    {
      title: "Faster Workflow",
      description:
        "Smart curation helped users find the right tools 10x faster.",
      idx: 2,
    },
  ];

  return (
    <div className="bg-white flex items-center justify-center p-8">
      <div className="flex flex-wrap justify-center items-center gap-12">
        {cardData.map((card, index) => (
          <InfoCard
            key={index}
            title={card.title}
            description={card.description}
            idx={index}
          />
        ))}
      </div>
    </div>
  );
};

export default InfoCards;