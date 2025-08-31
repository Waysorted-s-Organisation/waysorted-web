"use client"
import { useEffect, useRef, useState } from 'react';

interface AnimatedCardProps {
  number: string | number;
  title: string;
  description: string;
  className?: string;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  number, 
  title, 
  description, 
  className = "" 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-4">
      <div
        ref={cardRef}
        className={`
          relative overflow-hidden rounded-2xl bg-[#F97731]
          p-8 text-white w-[491px]
          ${className}
        `}>
        {/* Regular dots pattern */}
        
        <div className="relative z-10 flex items-start gap-6">
          {/* Number badge */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm">
            <span className="text-lg font-bold">
              {number}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-bold leading-tight">
              {title}
            </h3>
            <p className="text-white/90 leading-relaxed">
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
      title: "Lorem ipsum dolor sit amet, consectetur",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis.",
    },
    {
      number: "02",
      title: "Lorem ipsum dolor sit amet, consectetur",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis.",
    },
    {
      number: "03",
      title: "Lorem ipsum dolor sit amet, consectetur",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis.",
    },
    {
      number: "04",
      title: "Lorem ipsum dolor sit amet, consectetur",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis.",
    },
  ];

  return (
    <section className="orange-bg-dots px-6 md:px-20 lg:px-32 py-16">
      <h2 className="text-8xl font-bold text-center mb-12 text-black/19">Our Values</h2>

      <div className="max-w-xl mx-auto">
        {values.map((value, index) => (
          <AnimatedCard
            key={index}
            number={value.number}
            title={value.title}
            description={value.description}
          />
        ))}
      </div>
    </section>
  );
}
