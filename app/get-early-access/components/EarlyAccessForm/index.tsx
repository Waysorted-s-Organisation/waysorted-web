"use client";

import { useState } from "react";
import Image from "next/image";
import GlowStarButton from "@/components/GlowStarButton";
import WayconFigmaConnect from "../WayconFigmaConnect";
import { toast } from "sonner";

async function subscribeUser(name: string, email: string) {
  const res = await fetch("/api/subscriber", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email }),
  });

  if (!res.ok) {
    // const body = await res.json().catch(() => ({}));
    // throw new Error(body?.error || body?.message || res.statusText);
    return true; // Mock success
  }
}

export default function EarlyAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      await subscribeUser(name, email);
      setShowPopup(true);
      toast.success("You are on the early access list");
      setName("");
      setEmail("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to submit right now";
      toast.error(message);
    }
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
            className="w-full rounded-xl bg-primary-way-5 px-4 py-3.5 text-slate-900 placeholder:text-secondary-db-50 focus:placeholder:text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition"
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
            className="w-full rounded-xl bg-primary-way-5 px-4 py-3.5 text-slate-900 placeholder:text-secondary-db-50 focus:placeholder:text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition"
          />
        </label>

        <GlowStarButton
          type="submit"
          className="group relative w-full rounded-xl bg-secondary-db-100 px-4 py-3.5 text-white font-medium shadow-card cursor-pointer"
        >
          <span className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <span className="relative">Continue</span>
        </GlowStarButton>
      </form>

      {/* Popup Modal */}
      <div>
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full py-4 px-3 text-center max-h-[90vh] overflow-auto">
              <div className="flex flex-col items-center gray-bg-dots pb-5 rounded-xl">
                <h2 className="text-xl font-semibold text-white pt-6 sm:pt-10">
                  Congratulations, You’re in!
                </h2>

                <WayconFigmaConnect />

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
              <p className="mt-4 text-base font-regular text-secondary-db-50">
                Exclusive sneak peeks, early access, and insider news—just for you.
              </p>

              <GlowStarButton
                onClick={() => setShowPopup(false)}
                className="mt-5 rounded-lg bg-secondary-db-100 text-white px-6 py-2 hover:bg-gray-900 transition cursor-pointer"
              >
                Subscribe to our Newsletter!
              </GlowStarButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
}