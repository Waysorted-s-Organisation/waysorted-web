"use client";
import GlowingStarButton from "@/components/GlowStarButton";
import Image from "next/image";

export default function Coffee() {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center px-4 py-24 sm:py-40">
      {/* Heading */}
      <h1 className="text-2xl sm:text-5xl font-semibold text-secondary-db-100 mb-4 leading-tight">
        Sort it before
        <span className="shake-hover align-middle">
          <Image
            src="/icons/coffee.svg"
            alt="Coffee"
            width={60}
            height={60}
            sizes="(max-width: 640px) 32px, 60px"
            className="inline-block mx-2 cursor-pointer align-middle h-8 w-8 sm:h-[60px] sm:w-[60px]"
          />
        </span>
        Coffee&apos;s Ready!
      </h1>

      {/* Button */}
      <div className="flex flex-col items-center w-full py-10 sm:py-16 space-y-2">
        <GlowingStarButton
          className="bg-secondary-db-100 text-white rounded-2xl text-base sm:text-lg font-semibold px-4 py-3 flex items-center cursor-pointer inline-block shadow-glow"
          title="Try Now"
        >
          <span className="flex items-center text-xs md:text-xl font-semibold justify-center gap-3 sm:gap-4">
            It&apos;s Free - Try now!
            <span
              className="bg-white h-10 w-10 sm:h-14 sm:w-14 flex items-center justify-center rounded-xl"
              aria-hidden="true"
            >
              <Image
                src="/icons/rocket.svg"
                alt="Launch"
                width={30}
                height={30}
                sizes="(max-width: 640px) 24px, 30px"
                className="h-6 w-6 sm:h-7 sm:w-7"
              />
            </span>
          </span>
        </GlowingStarButton>

        <p className="text-secondary-db-60 font-regular text-xs sm:text-sm">
          No credit card required.
        </p>
      </div>
    </section>
  );
}