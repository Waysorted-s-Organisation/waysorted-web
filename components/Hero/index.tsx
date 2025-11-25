import Image from "next/image";
import GlowStarButton from "@/components/GlowStarButton";
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  return (
    <section
      id="hero"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-8"
    >
      <div id="hero-content" className="text-center">
        {/* Badge */}
        <button className="relative inline-flex items-center bg-white border border-secondary-db-20 rounded-full px-3 py-1 md:px-5 md:py-2 text-sm text-secondary-db-100 mb-4 cursor-pointer"
        onClick={() => {
                  router.push('/request-a-feature');
                }}>
          <Image
            src="/icons/tools.svg"
            alt="Hero Badge"
            width={16}
            height={16}
            className="mr-2"
          />
          Request a feature
          <span className="text-primary-way-100 font-medium pl-1.5 hover:underline">
            Learn More
          </span>
        </button>

        {/* Main heading */}
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold text-secondary-db-100 leading-tight mb-4">
          A single toolkit to
          <br />
          accelerate every idea.
        </h1>

        {/* Subheading */}
        <p className="text-sm md:text-base font-semibold max-w-2xl mx-auto mb-12 leading-relaxed">
          <span className="text-secondary-db-100">
            We provide a single hub to empower every creator.
          </span>
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Mobile-only: Get Early Access (matches the provided mock) */}
          <GlowStarButton
            aria-label="Get Early Access"
            className="sm:hidden w-49 max-w-xs border bg-secondary-db-100 text-white font-semibold text-base button-shadow px-5 py-3 rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            <span className="flex items-center justify-center gap-x-2">
              <span>Get Early Access</span>
            </span>
          </GlowStarButton>

          {/* Tablet/Desktop: keep existing CTA unchanged */}
          <GlowStarButton className="hidden sm:inline-flex border bg-secondary-db-100 text-white font-semibold text-base button-shadow px-5 py-3 rounded-xl active:scale-95 transition-transform cursor-pointer">
            <span className="flex items-center gap-x-2">
              <Image
                src="/icons/figma.svg"
                alt="Waysorted for Figma"
                width={16}
                height={16}
              />
              <span>Waysorted for figma</span>
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