"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ToolsPicker from "./ToolPicker";
import {ITool} from "@/models/tool";

export default function Footer() {
  const [tools, setTools] = useState<ITool[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tools/active", { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setTools(json.data ?? []);
      } catch (e) {
        if (!cancelled) setError("Failed to load tools");
        console.error("Footer tools fetch error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="relative bg-secondary-db-100 text-gray-300 px-4 sm:px-6 md:px-8 lg:px-16 pt-6 sm:pt-8 pb-5 rounded-t-3xl">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* ROW 1: Logo (top) */}
        <div className="w-full">
          <Link href="/" className="block">
            <div className="relative w-24 h-8 sm:w-28 sm:h-9 md:w-36 md:h-11">
              <Image src="/icons/logo-white.svg" alt="Waysorted Logo" fill className="object-contain" />
            </div>
          </Link>
        </div>

        {/* Two-column section (stacks on mobile) */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Right column (Release Notes) should come first on mobile */}
          <div className="order-1 lg:order-2 col-span-1 lg:col-span-4 self-start">
            <div className="bg-secondary-db-90 rounded-xl p-3 sm:p-4 md:p-5 min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="bg-secondary-db-80 w-full h-36 sm:h-40 md:h-48 rounded-md mb-3 sm:mb-4" />
                <h4 className="text-white font-medium text-lg sm:text-xl">Release Notes !</h4>
                <p className="text-gray-400 text-xs sm:text-sm text-regular mb-2 sm:mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>

              <div className="flex gap-2 justify-center items-center">
                <span className="w-8 h-1 bg-gray-200/70 rounded-full" />
                <span className="w-6 h-1 bg-white/30 rounded-full" />
                <span className="w-6 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>

          {/* Left column (Tools) appears second on mobile, first on desktop */}
          <div className="order-2 lg:order-1 col-span-1 lg:col-span-8">
            {error ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6">
                <div className="col-span-1 md:col-span-4 text-secondary-db-30 text-sm">Could not load tools.</div>
              </div>
            ) : tools === null ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6 animate-pulse">
                <div className="h-24 bg-secondary-db-90 rounded col-span-1" />
                <div className="h-24 bg-secondary-db-90 rounded col-span-1" />
                <div className="h-32 bg-secondary-db-90 rounded md:col-span-2" />
              </div>
            ) : tools.length > 0 ? (
              <ToolsPicker tools={tools} />
            ) : (
              // Empty state
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6">
                <div className="order-1 md:order-none">
                  <h3 className="font-semibold mb-3 sm:mb-4 text-white text-base sm:text-lg">Tools</h3>
                  <ul className="space-y-2 text-secondary-db-40 font-regular text-sm">
                    <li className="text-secondary-db-30">No tools available</li>
                  </ul>
                </div>
                <div className="order-2 md:order-none">
                  <h3 className="font-semibold mb-3 sm:mb-4 text-white text-base sm:text-lg">Category</h3>
                  <ul className="space-y-2 text-secondary-db-40 font-regular text-sm">
                    <li className="text-secondary-db-30">No categories available</li>
                  </ul>
                </div>
                <div className="order-3 md:order-none md:col-span-2">
                  <h3 className="font-semibold mb-3 sm:mb-4 text-white text-base sm:text-lg">Tool brief</h3>
                  <div className="bg-transparent border border-gray-700 rounded-xl p-4 sm:p-6 min-h-[140px] outline outline-1 outline-white/10 button-shadow flex flex-col justify-between">
                    <p className="text-secondary-db-30 font-regular text-sm mb-4">
                      Tools will appear here once added and activated.
                    </p>
                    <div className="pt-2">
                      <button className="inline-flex items-center gap-3 bg-secondary-db-100 outline outline-1 outline-secondary-db-90 px-4 sm:px-5 py-3 sm:py-4 rounded-full opacity-60 cursor-not-allowed">
                        <span className="text-sm font-medium text-white/80">Visit Plugin</span>
                        <Image src="/icons/arrow-white.svg" alt="Arrow Right" width={12} height={12} />
                      </button>
                    </div>
                  </div>
                </div>

                

                
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="dashed-line-white my-5 sm:my-6" />

        {/* Social + short text */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-sm text-white">Follow Waysorted</p>
          <div className="flex items-center gap-2 sm:gap-3 text-gray-400">
            {[
              { src: "/icons/insta.svg", alt: "Instagram" },
              { src: "/icons/linkedin.svg", alt: "LinkedIn" },
              { src: "/icons/discord.svg", alt: "Discord" },
              { src: "/icons/x.svg", alt: "X" },
            ].map((s) => (
              <div
                key={s.alt}
                className="w-8 h-8 rounded-md outline outline-1 outline-secondary-db-80 flex items-center justify-center cursor-pointer hover:bg-white/5 transition"
                role="button"
                tabIndex={0}
                aria-label={s.alt}
              >
                <Image src={s.src} alt={s.alt} width={16} height={16} />
              </div>
            ))}
          </div>

          <p className="text-xl leading-relaxed font-medium text-secondary-db-40 max-w-prose">
            Get exclusive updates!
          </p>
        </div>

        {/* Newsletter + link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 my-6 sm:my-8 items-start">
          <div className="col-span-1 lg:col-span-5">
            <h4 className="font-semibold text-secondary-db-40 mb-2 sm:mb-3">Get exclusive updates !</h4>
            <div className="flex items-stretch bg-white rounded-xl overflow-hidden w-full max-w-md">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-3 sm:px-4 py-2 text-secondary-db-60 focus:outline-none"
              />
              <button
                className="flex items-center justify-center -ml-8 sm:-ml-10 rounded-lg cursor-pointer w-8 h-8 sm:w-9 sm:h-9 hover:bg-secondary-db-10 transition-colors"
                title="Send"
              >
                <Image src="/icons/arrow-black.svg" alt="Send" width={16} height={16} className="object-contain" />
              </button>
            </div>

            <p className="text-xs text-secondary-db-60 mt-2 max-w-sm">
              Be the first to know about our updates. Unsubscribe anytime.
            </p>
          </div>

          <div className="col-span-1 lg:col-span-5 lg:col-start-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 text-sm">
              <div>
                <h5 className="font-semibold mb-2 sm:mb-3 text-white">Get Started</h5>
                <ul className="space-y-2 text-secondary-db-40">
                  <li><Link href="/get-early-access" className="hover:text-white">Early Access</Link></li>
                  <li><Link href="/learning" className="hover:text-white">Explore Tools</Link></li>
                  <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold mb-2 sm:mb-3 text-white">Company</h5>
                <ul className="space-y-2 text-secondary-db-40">
                  <li><Link href="/about-us" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/documents" className="hover:text-white">Docs</Link></li>
                  <li><Link href="/support" className="hover:text-white">Contact Us</Link></li>
                  <li><Link href="#" className="hover:text-white">Security</Link></li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold mb-2 sm:mb-3 text-white">Support</h5>
                <ul className="space-y-2 text-secondary-db-40">
                  <li><Link href="/request-feature" className="hover:text-white">Request a feature</Link></li>
                  <li><Link href="/report-bug" className="hover:text-white">Report a Bug</Link></li>
                  <li><Link href="/learning" className="hover:text-white">Learning</Link></li>
                  <li><Link href="/support" className="hover:text-white">FAQs</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-3 flex flex-col md:flex-row justify-between items-start md:items-center text-secondary-db-50 text-xs sm:text-sm gap-3">
          <span>© 2025 Waysorted</span>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}