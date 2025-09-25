"use client"
import { useRef } from 'react';
import { cn } from "@/lib/cn";

interface AnimatedCardProps {
  number: string | number;
  title: string;
  description: string;
  className?: string;
  tilt?: string; // e.g., rotate-2, -rotate-2
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  number, 
  title, 
  description, 
  className = "", 
  tilt = ""
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-4">
      <div
        ref={cardRef}
        className={cn(`
          relative overflow-hidden rounded-2xl bg-tertiary-orange-500
          p-8 text-white w-xl
          ${className}
        `, tilt)}>

        <div className="relative z-10 flex items-start gap-6">
          {/* Number badge */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl hover:border-2 hover:border-white/30 bg-white/10 backdrop-blur-sm">
            <span className="text-2xl font-semibold">
              {number}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-3">
            <h3 className="text-2xl font-semibold leading-tight">
              {title}
            </h3>
            <p className="text-white text-xl font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        </div>
    </div>
  );
};

export default function ValuesSection() {
  const values = [
    {
      number: "01",
      title: "Crafting a Morally Friendly Workspace",
      description: "We’re building a workspace where every worker isn’t just an asset but a vital contributor to our shared vision. At Waysorted, we foster an environment that values collaboration and supports the common goal of turning digital chaos into creative clarity.",
      tilt: "-rotate-[-3deg]",
    },
    {
      number: "02",
      title: "A Legacy of Contributors",
      description:
        "Our customers, employees, and community are our stakeholders, our partners in progress. We weave their insights into every decision, ensuring Waysorted remains a hub that solves the mysteries of workflow inefficiency, one step at a time.",
      tilt: "-rotate-[2deg]",
    },
    {
      number: "03",
      title: " A Zeal for Longevity",
      description:
        "Our mission is to deliver top-tier services that stand the test of time. While trends fade, our commitment to consistency and impact endures. We design lasting solutions, tools and platforms that guide creators beyond the moment and into a future of seamless productivity.",
      tilt: "rotate-[1.5deg]",
    },
    {
      number: "04",
      title: "Diversity of Thoughts",
      description:
        "We thrive on a vibrant, eclectic brainspace that celebrates variety. At Waysorted, we embrace diverse ideas, perspectives, and approaches, crafting designs and tools that serve not just one, but many—unlocking innovation for every creator in our community.",
      tilt: "-rotate-[2deg]",
    },
  ];

  return (
    <section className="tertiary-orange-500-bg-dots px-6 md:px-20 lg:px-32 py-12">
      <h2 className="text-8xl font-semibold text-center mb-12 text-tertiary-orange-500">Our Values</h2>

      <div className="max-w-xl mx-auto">
        {values.map((value, index) => (
          <AnimatedCard
            key={index}
            number={value.number}
            title={value.title}
            description={value.description}
            tilt={value.tilt}
          />
        ))}
      </div>
    </section>
  );
}
