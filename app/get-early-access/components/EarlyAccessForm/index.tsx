"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function EarlyAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // TODO: add your actual submission logic (API call etc.)
    setShowPopup(true);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tell us your name"
            className="w-sm rounded-lg bg-primary-way-5 px-4 py-3 text-slate-900 placeholder:text-secondary-db-50 focus:placeholder:text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition"
          />
        </label>

        <label className="block">
          <span className="sr-only">Email address</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address…"
            className="w-sm rounded-lg bg-primary-way-5 px-4 py-3 text-slate-900 placeholder:text-secondary-db-50 focus:placeholder:text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition"
          />
        </label>

        <button
          type="submit"
          className="group relative w-sm rounded-xl bg-secondary-db-100 px-4 py-3.5 text-white font-medium shadow-card cursor-pointer"
        >
          <span className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <span className="relative">Continue</span>
        </button>
      </form>

      {/* Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full py-4 px-3  text-center">
              <div className="flex flex-col items-center gray-bg-dots pb-5 rounded-xl">
              <h2 className="text-xl font-semibold text-white pt-10">
                Congratulations, You’re in!
              </h2>

              <div className="flex justify-center items-center gap-4 my-9">
                <Image src="/icons/waycon.svg" alt="Way Icon" width={60} height={60} />
                <span className="text-2xl">—</span>
                <Image src="/icons/figma.svg" alt="Figma" width={40} height={40} />
              </div>

              <p className="mt-4 text-sm rounded-2xl bg-white/6 px-4 py-2 text-base font-medium text-primary-way-10">
                Your Early Access key has been sent on the mail! 
                <Image
                  src="/icons/rocket-1.svg"
                  alt="Rocket Icon"
                  width={24}
                  height={24}
                  className="inline-block ml-2"
                />
              </p>
              </div>
              <p className="mt-7 text-base font-regular text-secondary-db-50">
                Exclusive sneak peeks, early access, and insider news—just for you.
              </p>

              <button
                onClick={() => setShowPopup(false)}
                className="mt-5 rounded-lg bg-black text-white px-20 py-2 hover:bg-gray-900 transition cursor-pointer"
              >
                Subscribe to our Newsletter!
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
