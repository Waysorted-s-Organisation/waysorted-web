import type { Metadata } from "next";

/*
 * Next injects its own `noindex` for a not-found render, and the root layout
 * declares `index, follow` for the rest of the site. Both landed on this page, so
 * it shipped two robots tags telling crawlers opposite things. Google resolves a
 * conflict by taking the most restrictive, so nothing was being indexed that
 * should not be - but "index, follow" on a 404 is a claim we never meant to make.
 *
 * Declaring it here overrides the layout, so both tags now say noindex. `follow`
 * stays on: this page links back to the homepage, and a 404 is a normal place for
 * a crawler to arrive and carry on from.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

import Image from "next/image";
import Link from "next/link";
export default function NotFound() {
  return (
    <>
      <main className="relative min-h-screen flex flex-col items-center pt-24 px-6 text-center error-bg-dots overflow-hidden bg-white select-none font-sans md:hidden">
        <div className="absolute top-0 left-0 w-36 sm:w-48">
          <Image
            src="/icons/wire-top-1.svg"
            alt="Wire decoration top left"
            width={150}
            height={150}
            className="w-full h-auto"
          />
        </div>
        <div className="absolute top-0 right-0 w-16 sm:w-20">
          <Image
            src="/icons/wire-top-2.svg"
            alt="Wire decoration top right"
            width={80}
            height={80}
            className="w-full h-auto"
          />
        </div>
        <div className="absolute bottom-20 left-0 w-20 sm:w-24">
          <Image
            src="/icons/wire-left-1.svg"
            alt="Wire decoration left"
            width={90}
            height={90}
            className="w-full h-auto"
          />
        </div>
        <div className="absolute bottom-0 -right-20 -translate-x-1/2 w-40 sm:w-48 z-10">
          <Image
            src="/icons/wire-bottom-1.svg"
            alt="Wire decoration bottom"
            width={160}
            height={200}
            className="w-full h-auto"
          />
        </div>
        <div className="relative z-20 flex flex-col items-center max-w-sm mx-auto">
          <div className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-full font-semibold text-sm mb-6">
            Page Not Found
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4 leading-snug">
            Oops, This page went on a creative break!
          </h1>

          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 px-2">
            We couldn&apos;t find the page you were looking for. No worries, you
            can head back to our{" "}
            <Link href="/" className="text-primary-way-100 underline">
              homepage
            </Link>{" "}
            to find your way!
          </p>
          <div className="w-full max-w-[280px]">
            <Image
              src="/icons/error-1.svg"
              alt="Error Laptop Illustration"
              width={280}
              height={280}
              className="w-full h-auto drop-shadow-sm"
              priority
            />
          </div>
        </div>
      </main>
      <main className="relative hidden md:flex min-h-screen flex-col items-center justify-center text-center px-4 error-bg-dots overflow-hidden select-none">
        {/* Top broken wires (you will insert images) */}
        <div className="absolute top-0 left-0">
          <Image
            src="/icons/wire-top.svg"
            alt="Wire Left"
            width={218}
            height={271}
          />
        </div>
        <div className="absolute bottom-0 right-0">
          <Image
            src="/icons/wire-down.svg"
            alt="Wire Right"
            width={493}
            height={345}
          />
        </div>
        <div className="absolute bottom-0 left-0">
          <Image
            src="/icons/wire-left.svg"
            alt="Wire Left"
            width={200}
            height={200}
          />
        </div>
        <div className="absolute top-0 right-20">
          <Image
            src="/icons/wire-right.svg"
            alt="Wire Right"
            width={128}
            height={461}
          />
        </div>

        {/* Page content */}
        <div className="z-10 w-3xl">
          <span className="inline-block px-6 py-2 rounded-full bg-primary-way-10 text-primary-way-100 font-semibold text-xl mb-6">
            Page Not Found
          </span>

          <h1 className="text-4xl font-semibold text-primary-way-100 mb-3">
            Oops, This page went on a creative break!
          </h1>

          <p className="text-secondary-db-80 font-medium text-base mb-12 w-2xl mx-auto">
            We couldn&apos;t find the page you were looking for. No worries, you
            can head back to our{" "}
            <Link href="/" className="text-primary-way-100 underline">
              homepage
            </Link>{" "}
            to find your way!
          </p>
          <div className="flex justify-center relative">
            <Image
              src="/icons/laptop-bg.svg"
              alt="404 Error"
              width={390}
              height={336}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/icons/laptop.svg"
                alt="404 Error"
                width={244}
                height={158}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
