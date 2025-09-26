"use client"
import Image from "next/image";
import EarlyAccessForm from "@/app/get-early-access/components/EarlyAccessForm";
import FeatureCard from "@/app/get-early-access/components/FeatureCard";
import { useRouter } from "next/navigation";

export default function EarlyAccessPage() {
  const router = useRouter();

  return (
    <main className="bg-white min-h-screen">
      <div className="mx-auto max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          
          {/* Left: Form */}
          <section className="max-w-xl flex flex-col justify-between">
            <div>
              <div className="my-6 ml-15">
                <Image
                  src="/images/logo.svg"
                  alt="Waysorted Logo"
                  title="Home"
                  onClick={() => router.push('/')}
                  className="cursor-pointer"
                  width={150}
                  height={40}
                  priority
                />
              </div>

              <div className="px-25 py-5">
                <span className="inline-flex items-center rounded-md bg-tertiary-green-100 text-tertiary-green-500 px-3 py-1 text-sm font-medium">
                  Full version drops soon.
                </span>

                <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-secondary-db-100">
                  Get early access!
                </h1>
                <p className="mt-3 text-base text-secondary-db-60">
                  Be one of the first few creators to become an early adopter.
                </p>

                <div className="mt-6">
                  <EarlyAccessForm />
                </div>

                <p className="mt-4 text-xs font-regular text-secondary-db-100">
                  We&apos;ll send you an Early Access Key!
                </p>
              </div>
            </div>

            {/* Footer text naturally at bottom */}
            <div className="flex px-22 pb-10 text-xs justify-center text-secondary-db-50 inline-block">
              By clicking “continue” you agree to our&nbsp;
              <span className="inline-block"><a href="#" className="text-primary-way-100 hover:underline">
                Privacy Policy
              </a>&nbsp;
              </span>
              and&nbsp;
              <span className="inline-block"><a href="#" className="text-primary-way-100 hover:underline">
                Terms of Use
              </a></span>
              .
            </div>
          </section>

          {/* Right: Feature panel */}
          <section className="relative overflow-hidden rounded-3xl rounded-none bg-primary-way-10 ">
            <div className="bg-primary-way-10 p-5 border-l border-primary-way-20 rounded-none">
              <div className="rounded-3xl blue-bg-dots p-10">
                <div className="relative rounded-2xl">
                  <div className="flex items-start justify-between">
                    <h2 className="text-white text-2xl font-regular w-1/2">
                      Discover everything Way has to offer…
                    </h2>
                    <div className="relative -mt-6 -mr-2">
                      <Image
                        src="/icons/Fastest.svg"
                        alt="Fastest"
                        width={100}
                        height={35}
                        className=""
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    <FeatureCard
                      title="Free Access to Premium Tools"
                      description="Unlock premium tools at no cost—boost your productivity and explore all that Waysorted has to offer, for free."
                      tilt="rotate-[-2deg]"
                    />
                    <FeatureCard
                      title="Community Access"
                      description="Join an exclusive space where fellow designers connect, share insights, and get direct access to the latest updates."
                      tilt="rotate-[2deg]"
                    />
                    <FeatureCard
                      title="Exclusive Early Adopter Badge"
                      description="Earn a unique badge that highlights your status on the upcoming leaderboard—stand out as a key contributor to Waysorted’s success."
                      tilt="rotate-[-1.5deg]"
                    />
                    <FeatureCard
                      title="Feature Requests & Bug Reporting"
                      description="Help shape the platform by requesting new features and reporting bugs—your feedback drives the future of Waysorted."
                      tilt="rotate-[1.5deg]"
                    />
                  </div>

                  <div className="relative -ml-10">
                    <Image
                      src="/icons/early-bird.svg"
                      alt="Early bird"
                      width={100}
                      height={35}
                      className=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
