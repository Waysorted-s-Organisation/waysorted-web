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
          relative overflow-hidden rounded-2xl bg-tertiary-orange-500
          p-8 text-white w-xl
          ${className}
        `}>
        
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
    <section className="tertiary-orange-500-bg-dots px-6 md:px-20 lg:px-32 py-12">
      <h2 className="text-8xl font-semibold text-center mb-12 text-tertiary-orange-500">Our Values</h2>

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
