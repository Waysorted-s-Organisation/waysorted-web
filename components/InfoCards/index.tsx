"use client";
import React, { useState, useEffect } from "react";
import { motion, useAnimation, useMotionValue, animate } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

export default function SegmentedProgressBar() {
  const controls = useAnimation();
  const [progress, setProgress] = useState<number>(0);

  const totalBars = 15; // Total segments
  const targetPercent = 72; // Target percentage
  const activeBars = Math.round((targetPercent / 100) * totalBars); // Bars to fill

  const handleHover = async (): Promise<void> => {
    // Reset
    setProgress(0);
    await controls.start({ opacity: 0.2 }); // Instantly hide bars

    // Animate percentage counter
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setProgress(count);
      if (count === targetPercent) clearInterval(interval);
    }, 20);

    // Animate bars filling one by one
    controls.start((i: number) => ({
      opacity: i < activeBars ? 1 : 0.2, // Filled or faded

      transition: {
        duration: 0.3,
        delay: i * 0.1, // Stagger effect
        ease: "linear",
      },
    }));
  };

  return (
    <div className=" flex items-center gap-4 " onMouseEnter={handleHover}>
      {/* Percentage Display */}
      <span className="w-14 text-3xl font-bold text-black ">{progress}%</span>

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

interface ArcBarsProps {
  /** Percentage (0–100) determining how many bars light up */
  percentage: number;
  /** Target center number (e.g. 10 to display "10x") */
  targetNumber: number;
}

const ArcBars: React.FC<ArcBarsProps> = ({ percentage, targetNumber }) => {
  const totalBars = 19;
  // Calculate how many bars should be lit based on percentage
  const barsLit = Math.round((percentage / 100) * totalBars);

  // SVG geometry settings (center of circle, inner/outer radii of bars)
  const centerX = 150;
  const centerY = 150;
  const innerRadius = 100;

  // Hover state
  const [hovered, setHovered] = useState(false);

  // Motion value for animating the center number
  const count = useMotionValue(0);
  const [displayCount, setDisplayCount] = useState(0);
  // Subscribe to motion value updates to set React state (rounded)
  useEffect(() => {
    const unsubscribe = count.on("change", (latest) => {
      setDisplayCount(Math.round(latest));
    });
    return () => unsubscribe();
  }, [count]);
  // Animate count when hover changes
  useEffect(() => {
    const controls = animate(count, hovered ? targetNumber : 0, {
      duration: 0.6,
    });
    return controls.stop; // clean up animation on unmount/prop change
  }, [hovered, targetNumber, count]);

  return (
    <div className=" absolute -top-[25%] left-1/2 transform -translate-x-1/2">
      <motion.svg
        className="w-72 h-72"
        viewBox="0 0 300 300"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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
          // Compute rotation so bar points outward along the circle
          const angleOnCircle = (180 * (totalBars - 1 - i)) / (totalBars - 1);
          const groupRotation = 90 - angleOnCircle;

          // Determine transition delay for stagger (forward on hover, reverse on leave)
          const delay = hovered
            ? i * 0.04
            : i < barsLit
            ? (barsLit - 1 - i) * 0.04
            : 0;

          return (
            <g
              key={i}
              transform={`
                translate(${centerX} ${centerY})
                rotate(${groupRotation})
                
                translate(0 ${-innerRadius})
              `}
            >
              <motion.path
                d="M0.104279 1.66846C0.0477705 0.764328 0.765818 0 1.67171 0H10.8922C11.7981 0 12.5162 0.764327 12.4597 1.66846L11.0855 23.6553C11.0337 24.483 10.3474 25.1279 9.51804 25.1279H3.04589C2.21657 25.1279 1.53019 24.483 1.47846 23.6553L0.104279 1.66846Z"
                rx={1.57} // Rounded corner horizontally
                ry={1.57}
                fill="#47c784" /* e.g. blue fill */
                initial={{ opacity: 0.2 }}
                animate={{ opacity: hovered && i < barsLit ? 1 : 0.2 }}
                transition={{ duration: 0.5, delay }}
              />
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
};

// function SemiCircleGauge() {
//   return (
//     <div className="flex  justify-center">
//       <div className="">
//         <SemiCircleSvg />
//         <div className="text-3xl font-bold text-black flex items-center justify-center ">
//           10x
//         </div>
//       </div>
//     </div>
//   );
// }

interface CardProps {
  title: string;
  description: string;

  idx: number;
}

const InfoCard: React.FC<CardProps> = ({ title, description, idx }) => {
  useGSAP(() => {
    gsap.registerPlugin();

    const tl = gsap.timeline({ repeat: -1, ease: "linear" });

    // Vertical line animation
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
          { scaleX: 0.6, duration: 2 }, // Animate from 0 → 0.5 in first 2 seconds
          { scaleX: 0.6, duration: 2 }, // Hold (pause) at 0.5 for 1 second
          { scaleX: 1, duration: 2 }, // Animate from 0.5 → 1 in last 2 seconds
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
          { scaleX: 0.6, duration: 2 }, // Animate from 0 → 0.5 in first 2 seconds
          { scaleX: 0.6, duration: 2 }, // Hold (pause) at 0.5 for 1 second
          { scaleX: 1, duration: 2 }, // Animate from 0.5 → 1 in last 2 seconds
        ],
      },
      "<"
    );

    tl.fromTo(
      ".node2",
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      6.6
    );
    tl.fromTo(
      ".node_outer2",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      6.6
    );
    tl.fromTo(
      ".node1",
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      8.6
    );
    tl.fromTo(
      ".node_outer1",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      8.6
    );

    tl.fromTo(
      ".node4",
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      6.6
    );
    tl.fromTo(
      ".node_outer4",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      6.6
    );
    tl.fromTo(
      ".node5",
      { scale: 1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      8.6
    );
    tl.fromTo(
      ".node_outer5",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5 },
      8.6
    );
  });

  return (
    // Card container with specified size, border, and shadow
    <div className="w-[306px] h-[255px] border border-secondary-db-20 rounded-xl shadow-sm flex flex-col bg-white p-2">
      {/* Top section for the visual element with a light background color */}
      {idx === 0 && (
        <div
          className={`h-[140.32px] rounded-t-xl flex items-center justify-center bg-[#FF7920]/5 orange-cursor`}
        >
          <SegmentedProgressBar />
        </div>
      )}
      {idx === 1 && (
        <div
          className={`h-[140.32px] relative rounded-t-xl flex items-center justify-center bg-[#F8F5FF]`}
        >
          <div className="flex flex-col gap-4 items-center ">
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
                  <div className="left-horizontal-line absolute top-1/2 left-[9px]  w-[90px] h-[2px] bg-[#7531F9]"></div>
                  <div className="right-horizontal-line absolute top-1/2  right-[9px] w-[90px] h-[2px] bg-[#7531F9]"></div>
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
        <div
          className={`h-[140.32px] rounded-t-xl flex items-center justify-center bg-[#47C784]/5 relative`}
        >
          <ArcBars targetNumber={10} percentage={70} />
        </div>
      )}
      {/* Bottom section for the text content */}
      <div className="h-[81.98px] p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-lg text-secondary-db-100 mb-1">
          {title}
        </h3>
        <p className="text-[13px] text-secondary-db-70  leading-4">
          {description}
        </p>
      </div>
    </div>
  );
};

// --- Main App Component ---
// This component lays out all the cards.

export const InfoCards = () => {
  // Data for the cards
  const cardData = [
    {
      title: "Increase in Productivity",
      description:
        "Users reported completing tasks 30% faster after switching to Waysorted plugin bundles.",
      bgColor: "bg-tertiary-orange-500-50",
    },
    {
      title: "Users recommend us",
      description:
        "Because great tools shouldn't slow you down, they should sort you out.",
      bgColor: "bg-tertiary-voilet-500-50",
    },
    {
      title: "Faster Workflow",
      description:
        "Smart curation helped users find the right tools 10x faster.",
      bgColor: "bg-tertiary-green-500-50",
    },
  ];

  return (
    // Main container to center the cards on the page
    <div className="bg-white flex items-center justify-center p-8">
      {/* Grid container for the cards with the specified gap */}
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
