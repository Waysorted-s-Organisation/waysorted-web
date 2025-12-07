"use client";

import Image from "next/image";
import Link from "next/link";

export default function ConnectedPage() {

  return (
    <div className="error-bg-dots min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col">
        <nav className="mx-auto px-4 py-3 w-full">
          <Link href="/" className="block flex items-center space-x-2" aria-label="Waysorted Home">
            <div className="relative w-24 h-8 sm:w-28 sm:h-9 md:w-32 md:h-10 lg:w-36 lg:h-11 translate-y-1">
              <Image src="/images/logo.svg" alt="WaySorted Logo" fill className="object-contain" priority />
            </div>
            <div className="text-xs font-medium text-primary-way-100 border border-primary-way-100 rounded-3xl inline-block py-1 px-2 translate-y-[-4px]">
              BETA
            </div>
          </Link>
        </nav>

        <section className="flex-grow flex items-center justify-center px-4 py-20">
          <div className="max-w-2xl w-full text-center">
            <div className="mx-auto w-28 h-28 rounded-full bg-[#EAF2FF] flex items-center justify-center">
              <Image src="/icons/confeti.svg" alt="celebration" width={157} height={157} className="object-contain" />
            </div>

            <h1 className="mt-8 text-3xl md:text-4xl font-semibold text-secondary-db-100">
              You&apos;re in with Way!
            </h1>

            <p className="mt-3 text-sm md:text-base font-regular text-secondary-db-100 w-full md:max-w-md mx-auto">
              <span className="font-semibold">Head back to Figma</span> and start exploring the Way plugin.
              <br /> Your productivity boost is waiting for you.
            </p>

            <div className="mt-8">
              {/* If you have a deep link to the Figma plugin, replace the href below */}
              <a
                href="https://www.figma.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-secondary-db-100 text-white px-6 py-3 text-base font-semibold w-full md:max-w-sm rounded-lg"
                aria-label="Head back to Figma"
              >
                Head back to Figma
                <Image src="/icons/figma.svg" alt="Figma logo" width={15} height={22} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}