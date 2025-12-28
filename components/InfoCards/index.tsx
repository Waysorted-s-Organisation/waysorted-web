"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue, animate, useScroll, useTransform, MotionValue } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ImpactTop from "../ImpactTop";

// --- Component 1: Segmented Progress Bar (Scroll Linked) ---
export function SegmentedProgressBar({ progressValue }: { progressValue: MotionValue<number> }) {
  const [displayProgress, setDisplayProgress] = useState<number>(0);

  const totalBars = 15;
  const targetPercent = 72;
  const activeBars = Math.round((targetPercent / 100) * totalBars);

  // Sync display counter with scroll progress
  useEffect(() => {
    return progressValue.on("change", (v) => {
      setDisplayProgress(Math.round(v * targetPercent));
    });
  }, [progressValue]);

  return (
    <div className="flex items-center gap-4">
      {/* Percentage Display */}
      <span className="w-14 text-3xl font-bold text-black">{displayProgress}%</span>

      {/* Segmented Bar Container */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalBars }).map((_, idx) => {
          // Calculate when this specific bar should light up
          const threshold = (idx / totalBars) * 1.0; 
          // We use scroll progress (0-1) to determine opacity
          const opacity = useTransform(progressValue, [threshold, threshold + 0.1], [0.2, idx < activeBars ? 1 : 0.2]);

          return (
            <motion.div
              key={idx}
              style={{ opacity }}
              className="w-[8.51px] h-[38.31px] rounded-md bg-[#ff7920]"
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Component 2: Arc Bars (Scroll Linked) ---
interface ArcBarsProps {
  targetNumber: number;
  progressValue: MotionValue<number>;
}

const ArcBars: React.FC<ArcBarsProps> = ({ targetNumber, progressValue }) => {
  const totalBars = 19;
  const centerX = 150;
  const centerY = 150;
  const innerRadius = 100;

  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    return progressValue.on("change", (v) => {
      setDisplayCount(Math.round(v * targetNumber));
    });
  }, [progressValue, targetNumber]);

  return (
    <div className="absolute -top-[25%] left-1/2 transform -translate-x-1/2">
      <motion.svg className="w-72 h-72" viewBox="0 0 300 300">
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

        {Array.from({ length: totalBars }).map((_, i) => {
          const angleOnCircle = (180 * (totalBars - 1 - i)) / (totalBars - 1);
          const groupRotation = 90 - angleOnCircle;

          return (
            <g
              key={i}
              transform={`translate(${centerX} ${centerY}) rotate(${groupRotation}) translate(0 ${-innerRadius}) translate(-6.25 0)`}
            >
              <path
                className={`arc-bar-${i}`}
                d="M0.104279 1.66846C0.0477705 0.764328 0.765818 0 1.67171 0H10.8922C11.7981 0 12.5162 0.764327 12.4597 1.66846L11.0855 23.6553C11.0337 24.483 10.3474 25.1279 9.51804 25.1279H3.04589C2.21657 25.1279 1.53019 24.483 1.47846 23.6553L0.104279 1.66846Z"
                fill="#47c784"
                style={{ opacity: 0.2 }}
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
  scrollYProgress: MotionValue<number>;
}

const InfoCard: React.FC<CardProps> = ({ title, description, idx, scrollYProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Staggering ranges based on card index (0 -> 1) within the normalized range
  // Increased gaps between card starts and traveling 100px up
  const ranges = [
    { start: 0.0, end: 0.3 },
    { start: 0.25, end: 0.65 },
    { start: 0.6, end: 1.0 }
  ];
  const rStart = ranges[idx].start;
  const rEnd = ranges[idx].end;

  const opacity = useTransform(scrollYProgress, [rStart, rEnd], [0, 1]);
  const y = useTransform(scrollYProgress, [rStart, rEnd], [30, 0]);

  // Motion value for internal animations (progress within its own range)
  const internalProgress = useTransform(scrollYProgress, [rStart, rEnd], [0, 1]);

  useGSAP(() => {
    if (idx === 1) {
    // 🔴 FORCE INITIAL STATES
    gsap.set(
      [
        ".node_outer1", ".node1",
        ".node_outer2", ".node2",
        ".node_outer3", ".node3",
        ".node_outer4", ".node4",
        ".node_outer5", ".node5",
      ],
    { scale: 0.2, opacity: 0 }

    );

    gsap.set(".vertical-line", {
      scaleY: 0,
      opacity: 0,
      transformOrigin: "top",
    });

    gsap.set(
      [".left-horizontal-line", ".right-horizontal-line"],
      {
        scaleX: 0,
        opacity: 0,
      }
    );


    gsap.set(
  [".left-line-near", ".left-line-far"],
  {
    scaleX: 0,
    opacity: 0,
    transformOrigin: "right", // Grow from right to left
  }
);

gsap.set(
  [".right-line-near", ".right-line-far"],
  {
    scaleX: 0,
    opacity: 0,
    transformOrigin: "left", // Grow from left to right
  }
);

gsap.set(".t-node", {
  scale: 0.2,
  opacity: 0,
});


  }

  const tl = gsap.timeline({ paused: true });

    if (idx === 1) {
  tl
    // 1️⃣ Center dot grows
    .to([".node_outer3", ".node3"], {
      scale: 1,
      opacity: 1,
      duration: 0.15,
      ease: "power3.out",
    })

    // 2️⃣ Vertical line grows
    .to(".vertical-line", {
      scaleY: 1,
      opacity: 1,
      duration: 0.2,
      ease: "power2.out",
    })

    // 3️⃣ Horizontal NEAR lines grow
    // 3️⃣ T-junction dot grows
.to(".t-node", {
  scale: 1,
  opacity: 1,
  duration: 0.12,
  ease: "power3.out",
})

// 4️⃣ Horizontal NEAR lines grow AFTER T-dot
.to(
  [".left-line-near", ".right-line-near"],
  {
    scaleX: 1,
    opacity: 1,
    duration: 0.18,
    ease: "power2.out",
  }
)


    // 4️⃣ Near dots grow ONLY after near line
    .to(
      [".node_outer2", ".node2", ".node_outer4", ".node4"],
      {
        scale: 1,
        opacity: 1,
        duration: 0.14,
        ease: "power3.out",
      },
      "<+=0.12"

    )

    // 5️⃣ Horizontal FAR lines grow
    .to(
      [".left-line-far", ".right-line-far"],
      {
        scaleX: 1,
        opacity: 1,
        duration: 0.18,
        ease: "power2.out",
      }
    )

    // 6️⃣ Far dots grow after far line
    .to(
      [".node_outer1", ".node1", ".node_outer5", ".node5"],
      {
        scale: 1,
        opacity: 1,
        duration: 0.14,
        ease: "power3.out",
      },
      "<+=0.12"

    );
}



 else if (idx === 2) {
      const totalBars = 19;
      const barsLit = Math.round((70 / 100) * totalBars);
      for (let i = 0; i < totalBars; i++) {
        const isEligible = i < barsLit;
        tl.to(`.arc-bar-${i}`, {
          opacity: isEligible ? 1 : 0.2,
          duration: 0.1,
        }, i / totalBars);
      }
    }

    tl.progress(0);

    const unsubscribe = internalProgress.on("change", (v) => {
      tl.progress(v);
    });

    return () => {
      unsubscribe();
      tl.kill();
    };
  }, [idx, internalProgress]);

  return (
    <motion.div 
      ref={containerRef}
      style={{ opacity, y }}
      className="w-[306px] h-[255px] border border-secondary-db-5 rounded-xl flex flex-col bg-white p-2"
    >
      {/* Visual Section */}
      {idx === 0 && (
        <div className="h-[140.32px] rounded-t-xl flex items-center justify-center bg-[#FF7920]/5">
          <SegmentedProgressBar progressValue={internalProgress} />
        </div>
      )}

      {idx === 1 && (
        <div className="h-[140.32px] relative rounded-t-xl flex items-center justify-center bg-[#F8F5FF]">
          <div className="flex flex-col gap-4 items-center">
            {/* Tree Graph DOM Structure */}
            <div className="node_outer3 relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">
              <div className="node3 w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]">
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
              <div className="node_outer relative flex items-center justify-center w-[36.77px] h-[36.77px] bg-[#7531F930] rounded-[50%]">

                {/* Center node spacer */}
                <div className="relative node t-node w-[23.7px] h-[23.7px] bg-[#7531F9] rounded-[50%]">

                  {/* LEFT */}
<div className="left-line-near absolute top-1/2 right-full w-[45px] h-[2px] bg-[#7531F9]"></div>
<div className="left-line-far absolute top-1/2 right-[calc(100%+45px)] w-[45px] h-[2px] bg-[#7531F9]"></div>

{/* RIGHT */}
<div className="right-line-near absolute top-1/2 left-full w-[45px] h-[2px] bg-[#7531F9]"></div>
<div className="right-line-far absolute top-1/2 left-[calc(100%+45px)] w-[45px] h-[2px] bg-[#7531F9]"></div>

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
          <ArcBars targetNumber={10} progressValue={internalProgress} />
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
    </motion.div>
  );
};

// --- Main App Component ---
export const InfoCards = () => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useMotionValue(0);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "top top",
      end: "+=1200",
      pin: containerRef.current,
      scrub: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        scrollYProgress.set(self.progress);
      }
    });
  }, []);

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
    <div ref={triggerRef} className="w-full">
      <div 
        ref={containerRef}
        className="bg-white w-full h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="w-full">
          <ImpactTop />
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-12 max-w-7xl mx-auto mt-12">
          {cardData.map((card, index) => (
            <InfoCard
              key={index}
              title={card.title}
              description={card.description}
              idx={index}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoCards;
