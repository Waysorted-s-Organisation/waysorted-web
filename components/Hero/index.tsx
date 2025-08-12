import Image from 'next/image'
const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">
      <div className="text-center">
        {/* Badge */}
        <div className="relative inline-flex items-center bg-white border border-primary-dark-20 rounded-full px-5 py-2 text-sm text-primary-dark mb-2">
          <Image
            src="/icons/tools.svg"
            alt="Hero Badge"
            width={16}
            height={16}
            className="mr-2"
          />
          Unified Tools Hub for Makers
        </div>


        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-primary-dark leading-tight mb-2">
          Plan. Design.<br />
          Build. Maintain.
        </h1>

        {/* Subheading */}
        <p className="text-base font-medium max-w-2xl mx-auto mb-9 leading-relaxed">
          <span className="font-bold text-primary-dark">10+ expert-approved Figma tools</span> <span className="text-primary-dark-70">— bundled by use case, optimized for performance,<br />
          and designed to help you work smarter, not harder.</span>
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-primary-dark text-white text-base font-semibold px-10 py-4 rounded-xl flex items-center space-x-3 active:scale-95 transition-transform cursor-pointer">
            <span>See Pricing</span>
            <Image
              src="/icons/arrow-white.svg"
              alt="Arrow Right"
              width={12}
              height={12}
            />
          </button>
          <button className="border border-primary-dark-20 font-semibold text-base button-shadow text-primary-dark px-5 py-4 rounded-xl flex items-center space-x-3 active:scale-95 transition-transform cursor-pointer">
            <span>Request Feature</span>
            <Image
              src="/icons/arrow-black.svg"
              alt="Arrow Right"
              width={12}
              height={12}
            />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero