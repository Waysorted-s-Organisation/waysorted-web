'use client';

import Image from "next/image";
import GlowStarButton from "@/components/GlowStarButton";
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  const handleFigmaClick = () => {
    // Check for mobile (matches Tailwind's lg breakpoint of 1024px)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      // Redirect to your new dedicated mobile page
      router.push('/mobile-redirect');
    } else {
      // Desktop behavior
      window.open("https://www.figma.com/community/plugin/1532842109377504268/waysorted", "_blank");
    }
  };

  return (
    <section
      id="hero"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-8"
    >
      <div id="hero-content" className="text-center">
        {/* Badge */}


        {/* Main heading */}
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold text-secondary-db-100 leading-tight mb-4">
          Accelerate every idea with
          <br />
          <span className="text-primary-way-100">one powerful suite</span>
        </h1>

        {/* Subheading */}
        <p className="text-sm md:text-base font-semibold max-w-2xl mx-auto mb-12 leading-relaxed">
          <span className="text-secondary-db-100">
            Built to replace them all with one unified tool suite which works across softwares.
          </span>
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <GlowStarButton
            onClick={handleFigmaClick}
            className="inline-flex border bg-secondary-db-100 text-white font-semibold text-base button-shadow px-5 py-3 rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            <span className="flex items-center gap-x-2">
              <Image
                src="/icons/figma.svg"
                alt="Waysorted for Figma"
                width={16}
                height={16}
              />
              <span>Waysorted for Figma</span>
              <Image
                src="/icons/arrow-white.svg"
                alt="Arrow Right"
                width={12}
                height={12}
              />
            </span>
          </GlowStarButton>
        </div>
      </div>
    </section>
  );
};

export default Hero;