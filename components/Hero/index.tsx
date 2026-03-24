'use client';

import Image from "next/image";
import { useRouter } from 'next/navigation';
import GlowStarButton from '@/components/GlowStarButton';

const Hero = () => {
  const router = useRouter();

  const handleFigmaClick = () => {
    window.open("https://www.figma.com/community/plugin/1532842109377504268/waysorted", "_blank");
  }; return (
    <section
      id="hero"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-8"
    >
      <div id="hero-content" className="text-center">
        {/* Request a feature badge */}
        <button
          className="relative border-white hover:border-[#E9EEFA] cursor-pointer border-2 inline-flex items-center gap-3 bg-white hover:bg-[#265BD1]/4 rounded-2xl px-2 py-2 md:px-2 md:py-2 text-sm font-medium shadow-[0_4px_16.4px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-shadow"
          onClick={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
              router.push('/mobile-redirect');
            } else {
              router.push('/requests');
            }
          }}
        >
          <span className="bg-primary-way-100 text-white rounded-2xl px-3 py-1 text-sm font-semibold">
            Request
          </span>
          <span className="text-secondary-db-100">
            Tell us what you need in your workflow
          </span>
          <Image
            src="/icons/request-arrow.svg"
            alt="arrow" 
            width={12}
            height={6}
            className="w-3 h-4 flex-shrink-0"
          />
        </button>

        {/* Main heading */}
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold text-secondary-db-100 leading-tight mb-4">
          Accelerate every idea with
          <br />
          <span className="text-primary-way-100">one powerful suite</span>
        </h1>

        {/* Subheading */}
        <p className="text-sm md:text-base font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
          <span className="text-secondary-db-100">
            Built to replace them all with one unified tool suite which works across softwares.
          </span>
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <GlowStarButton
            onClick={handleFigmaClick}
            className="inline-flex items-center gap-x-2 border bg-secondary-db-100 border-secondary-db-20 text-white font-semibold text-base button-shadow px-5 py-3 rounded-xl active:scale-95 transition-transform cursor-pointer force-hover"
          >
            <span className="flex items-center gap-x-2">
              <Image
                src="/icons/figma.svg"
                alt="Figma"
                title="Figma"
                width={20}
                height={20}
              />
              <span>Waysorted for Figma</span>
            </span>
          </GlowStarButton>
        </div>
      </div>
    </section >
  );
};

export default Hero;