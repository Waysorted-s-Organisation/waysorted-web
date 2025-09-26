import Image from "next/image";

const Hero = () => {
  return (
    <section
      id="hero"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-8"
    >
      <div id="hero-content" className="text-center">
        {/* Badge */}
        <button className="relative inline-flex items-center bg-white border border-secondary-db-20 rounded-full px-5 py-2 text-sm text-secondary-db-100 mb-4 active:scale-95 transition-transform cursor-pointer">
          <Image
            src="/icons/tools.svg"
            alt="Hero Badge"
            width={16}
            height={16}
            className="mr-2"
          />
          Request a feature
          <span className="text-primary-way-100 font-medium pl-1.5">
            Learn More
          </span>
        </button>

        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-secondary-db-100 leading-tight mb-4">
          A single toolkit to
          <br />
          accelerate every idea.
        </h1>

        {/* Subheading */}
        <p className="text-base font-semibold max-w-2xl mx-auto mb-12 leading-relaxed">
          <span className="text-secondary-db-100">
            We provide a single hub to empower every creator.
          </span>
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="border bg-secondary-db-100 text-white font-semibold text-base button-shadow px-5 py-3 rounded-xl flex items-center space-x-2 active:scale-95 transition-transform cursor-pointer">
            <Image
              src="/icons/figma.svg"
              alt="Waysorted for Figma"
              width={16}
              height={16}
              className="mr-2"
            />
            <span>Waysorted for figma</span>
            <Image
              src="/icons/arrow-white.svg"
              alt="Arrow Right"
              width={12}
              height={12}
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
