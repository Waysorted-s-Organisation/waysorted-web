"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import EarlyAccessForm from "@/app/get-early-access/components/EarlyAccessForm";
import FeatureCard from "@/app/get-early-access/components/FeatureCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

const FEATURES = [
  {
    title: "Free Access to Premium Tools",
    description: (
      <span>
        Unlock all premium tools at no cost during beta. Boost your productivity and explore everything
        Waysorted has to offer,{" "}
        <span className="text-primary-way-100 font-medium">completely free.</span>
      </span>
    ),
    tilt: "rotate-[-2deg]",
  },
  {
    title: "Unlimited Credits for Beta Users",
    description: (
      <span>
        Enjoy{" "}
        <span className="text-tertiary-green-500 font-medium">
          unlimited credits
        </span>{" "}
        throughout the Beta Program. Experiment, test, and work without limits.
      </span>
    ),
    tilt: "rotate-[2deg]",
  },
  {
    title: "Exclusive Early Adopter Badge",
    description: (
      <span>
        Stand out as a{" "}
        <span className="text-tertiary-orange-500 font-medium">
          founding creator
        </span>
        . Your badge highlights you on the leaderboard and marks your place as one of the
        very first Beta members.
      </span>
    ),
    tilt: "rotate-[-1.5deg]",
  },
  {
    title: "Community Access",
    description: (
      <span>
        Join an{" "}
        <span className="text-tertiary-voilet-500 font-medium">
          exclusive space
        </span>{" "}
        for designers. Share insights, connect with others, get support, and receive early updates straight from the Waysorted team.
      </span>
    ),
    tilt: "rotate-[1.5deg]",
  },
];

export default function EarlyAccessPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="bg-white h-screen lg:h-screen lg:overflow-hidden">
      <div className="mx-auto max-w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch h-full">

          <section className="relative w-full flex flex-col h-full px-6 pt-6 pb-2 sm:px-12 sm:pt-8 lg:max-w-2xl">

            <div className="flex-1 flex flex-col no-scrollbar">

              {/* Header / Logo */}
              <div className="relative mb-6 shrink-0">
                <div className="flex justify-between items-start">
                  <div className="my-6 md:ml-15">
                    <Image
                      src="/images/logo.svg"
                      alt="Waysorted Logo"
                      title="Home"
                      onClick={() => router.push("/")}
                      className="cursor-pointer"
                      width={150}
                      height={40}
                      priority
                    />
                  </div>

                  {/* Mobile Floating Stickers */}
                  <div className="block lg:hidden relative w-32 h-24">
                    <Image
                      src="/icons/Fastest.svg"
                      alt="Fastest"
                      width={90}
                      height={30}
                      className="absolute top-0 right-0 z-10 transform rotate-2"
                    />
                    <Image
                      src="/icons/early-bird.svg"
                      alt="Early bird"
                      width={90}
                      height={30}
                      className="absolute top-12 right-6 z-0 transform -rotate-3"
                    />
                  </div>
                </div>
              </div>

              {/* Main Text & Form */}
              <div className="px-4 sm:px-25 py-2 flex-1">
                <span className="hidden lg:inline-flex items-center rounded-md bg-tertiary-green-100 text-tertiary-green-500 px-3 py-1 text-sm font-medium">
                  BETA version drops soon.
                </span>
                <span className="inline-flex lg:hidden items-center rounded-md bg-tertiary-green-100 text-tertiary-green-500 px-3 py-1 text-sm font-medium">
                  Full version drops soon.
                </span>

                <h1 className="hidden lg:block mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-secondary-db-100">
                  Join Waitlist for Waysorted
                </h1>
                <h1 className="block lg:hidden mt-5 text-3xl font-bold tracking-tight text-secondary-db-100">
                  Get early access!
                </h1>

                <p className="mt-3 text-base text-secondary-db-60">
                  Be one of the first few creators to become an early adopter.
                </p>

                <div className="mt-6">
                  <EarlyAccessForm />
                </div>


                {/* Mobile Carousel */}
                <div className="my-12 lg:hidden block">
                  <div className="relative w-full max-w-sm mx-auto">
                    <div className="transform transition-all duration-500 ease-in-out">
                      <FeatureCard
                        title={FEATURES[currentSlide].title}
                        description={FEATURES[currentSlide].description}
                        tilt="rotate-0"
                      />
                    </div>
                    <div className="flex justify-center gap-2 mt-6">
                      {FEATURES.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            currentSlide === index
                              ? "w-8 bg-primary-way-100"
                              : "w-1.5 bg-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex px-4 sm:px-22 pb-6 pt-4 text-xs justify-center text-secondary-db-50 mt-auto">
              <div>
                By clicking “continue” you agree to our&nbsp;
                <span className="inline-block">
                  <Link
                    href="/docs/privacy-policy"
                    className="text-primary-way-100 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  &nbsp;
                </span>
                and&nbsp;
                <span className="inline-block">
                  <Link
                    href="/docs/terms-of-service"
                    className="text-primary-way-100 hover:underline"
                  >
                    Terms of Use
                  </Link>
                </span>
                .
              </div>
            </div>
          </section>
          <section className="hidden lg:block relative h-full bg-primary-way-10 border-l border-primary-way-20">
            <div className="h-full p-4 flex flex-col">

              <div className="h-full flex flex-col justify-between rounded-3xl blue-bg-dots px-8 py-5 overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between shrink-0 mb-4">
                  <h2 className="text-white text-2xl font-regular w-1/2">
                    Discover everything Way has to offer…
                  </h2>
                  <div className="relative -mt-3 -mr-2">
                    <Image
                      src="/icons/Fastest.svg"
                      alt="Fastest"
                      width={100}
                      height={35}
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between min-h-0 py-1 gap-5">
                  {FEATURES.map((feature, idx) => (
                    <FeatureCard
                      key={idx}
                      title={feature.title}
                      description={feature.description}
                      tilt={feature.tilt}
                    />
                  ))}
                </div>

                <div className="relative -ml-8 shrink-0 mt-4">
                  <Image
                    src="/icons/early-bird.svg"
                    alt="Early bird"
                    width={100}
                    height={35}
                  />
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}