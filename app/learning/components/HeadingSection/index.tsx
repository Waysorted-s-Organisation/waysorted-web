import Image from "next/image";

export default function HeadingSection() {
  return (
    <div className="max-w-7xl mx-auto px-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-6">
      {/* Left Side */}
      <div>
        <div className="flex items-center gap-2 my-2 md:my-4">
          <span className="inline-flex items-center text-xs md:text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md md:rounded-md shadow-sm md:shadow-none">
            <Image
              src="/icons/waylearn.svg"
              alt="WayLearning"
              width={30}
              height={30}
              className="block p-1"
            />
            <span className="pl-1 pr-2 py-1 text-secondary-db-100">WayLearning</span>
          </span>
        </div>

        {/* Mobile: slightly smaller title for better wrap; md+: original size */}
        <h1 className="text-[28px] leading-[34px] md:text-4xl md:leading-tight md:w-lg font-semibold text-secondary-db-100">
          All You Need to Know about Tools
        </h1>

        {/* On < md keep description below the title */}
        <p className="text-secondary-db-80 mt-3 md:hidden text-base leading-6 font-medium max-w-md">
          Quick guides and smart tips to master every feature with ease.
        </p>
      </div>

      {/* Right Side (unchanged ≥ md) */}
      <p className="text-secondary-db-80 hidden md:block max-w-md my-4 md:my-8 text-xl font-medium">
        Quick guides and smart tips to master every feature with ease.
      </p>
    </div>
  );
}