"use client";

import GlowStarButton from "@/components/GlowStarButton";
import Image from "next/image";
import Link from "next/link";


export default function DisconnectedPage() {


  return (
    <div className="error-bg-dots min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col">
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

        <section className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Image src="/icons/way-access.svg" alt="Way access icon" width={59} height={59} />
                </div>

                <h2 className="mt-6 text-xl font-semibold text-secondary-db-100">
                  Way needs access <Image src="/icons/key.svg" alt="Figma logo" width={31} height={15} className="inline-block ml-1 mb-1" />
                </h2>

                <p className="mt-3 text-sm text-secondary-db-60 font-medium text-center">
                  To use this plugin, please allow it to connect with your account.
                </p>

                <GlowStarButton
                  className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-primary-way-100 font-medium text-base text-white px-5 py-3 cursor-pointer"
                  aria-label="Allow access"
                >
                  Allow access
                </GlowStarButton>


                <p className="mt-4 text-xs text-secondary-db-70 font-medium text-center">
                  By continuing, you agree to let Way use your information according to our{" "}
                  <Link href="/docs/terms-of-service" className="underline text-primary-way-100">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/docs/privacy-policy" className="underline text-primary-way-100">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}