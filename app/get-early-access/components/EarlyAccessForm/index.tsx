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

  const data = await res.json();

  if (!res.ok) {
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(data.error || "Something went wrong. Please try again.");
    }
  }

  return data;
}

export default function EarlyAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);

    try {
      await subscribeUser(name, email);
      setShowPopup(true);
      toast.success("You are on the early access list!");

      setName("");
      setEmail("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to submit right now";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary-way-5 px-4 py-3.5 text-slate-900 placeholder:text-secondary-db-50 focus:placeholder:text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition disabled:opacity-70"
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
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary-way-5 px-4 py-3.5 text-slate-900 placeholder:text-secondary-db-50 focus:placeholder:text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition disabled:opacity-70"
          />
        </label>

        <GlowStarButton
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full rounded-xl bg-secondary-db-100 px-4 py-3.5 text-white font-medium shadow-card cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <span className="relative">
            Continue
          </span>
        </GlowStarButton>
      </form>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-3 overflow-hidden relative">

            <div className="flex flex-col items-center gray-bg-dots pb-2 rounded-xl relative w-full">

              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-md hover:bg-white/10 transition z-20 cursor-pointer"
                aria-label="Close modal"
              >
                <Image
                  src="/icons/close-access.svg"
                  alt="Close"
                  width={12}
                  height={12}
                  className="opacity-80 hover:opacity-100"
                />
              </button>

              <h2 className="text-xl font-semibold text-white pt-10 sm:pt-12">
                Congratulations, You’re on the waitlist! 🎉
              </h2>

              <WayconFigmaConnect />

              <p className="my-2 text-sm rounded-2xl bg-white/10 px-4 py-2 font-medium text-primary-way-10 flex items-center gap-2 backdrop-blur-sm border border-white/5">
                Thanks for signing up. Updates coming soon!
              </p>
            </div>
            <div className="bg-white py-2 px-10 text-center">
              <p className="text-base text-secondary-db-90 font-medium leading-relaxed">
                You’re on the waitlist. We’ll share sneak peeks and reach out when early access opens.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}