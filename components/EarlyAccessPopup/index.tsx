"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FeatureCard from "@/app/get-early-access/components/FeatureCard";
import EarlyAccessForm from "@/app/get-early-access/components/EarlyAccessForm";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function EarlyAccessPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem("earlyAccessSeen");
    if (!seen) {
      setShowPopup(true);
      localStorage.setItem("earlyAccessSeen", "true");
    }
  }, []);

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] mx-4 md:mx-0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPopup(false)}
              aria-label="Close popup"
              title="Close"
              className="absolute top-3 right-3 z-10 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            {/* Corrected layout (Features left, Form right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">

              {/* Left: Features */}
              <section className="relative overflow-hidden">
                <div className="blue-bg-dots p-4 h-full">
                  <div className="p-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h2 className="text-white text-2xl font-medium w-2/3">
                          Discover everything Way has to offer…
                        </h2>
                        <Image
                          src="/icons/Fastest.svg"
                          alt="Fastest"
                          width={100}
                          height={35}
                          className="-mt-4"
                        />
                      </div>

                      <div className="mt-1 space-y-5">
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
                    </div>

                    <div className="relative -ml-6 mt-5">
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

              {/* Right: Form */}
              <section className="flex flex-col justify-between bg-white px-12 py-10">
                <div className="mt-20">

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

                  <p className="mt-4 text-xs text-secondary-db-100">
                    We&apos;ll send you an Early Access Key!
                  </p>
                </div>

                <div className="flex px-2 pt-10 text-xs justify-center text-secondary-db-50">
                  By clicking “continue” you agree to our&nbsp;
                  <a href="#" className="text-primary-way-100 hover:underline">Privacy Policy</a>&nbsp;
                  and&nbsp;
                  <a href="#" className="text-primary-way-100 hover:underline">Terms of Use</a>.
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
