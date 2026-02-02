"use client";

import Image from "next/image";
import type { IUser } from "@/types/user";

type Props = {
  user: IUser;
};

export default function CreditsUsageCard({ user }: Props) {
  const { earlyAccess, creditsRemaining } = user;

  // Compute total and used credits dynamically
  const total = earlyAccess ? 200 : 5;
  const remaining = Math.max(0, creditsRemaining);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const used = total - remaining;


  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      {/* Header */}
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h2 className="text-base font-medium text-secondary-db-100">Credits Usage</h2>
        <p className="text-sm text-secondary-db-80 font-medium">
          Track and manage your Waysorted credits with ease
        </p>
      </header>

      <div className="px-6 pb-6 pt-5">
        {/* Summary bar */}
        <div className="flex flex-col gap-4 rounded-md border border-secondary-db-5 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="leading-none">
              <Image
                src="/icons/clock.svg"
                alt="Credits Icon"
                width={16}
                height={19}
                className="object-contain"
              />
            </span>
            <span className="text-secondary-db-90 text-xl font-semibold">
              {earlyAccess ? "∞" : "0"}
            </span>
            <span className="text-secondary-db-90 text-sm">
              / <span className="text-xl">{earlyAccess ? "∞" : "0"} </span>
              {!earlyAccess && "credits left"}
              {earlyAccess && <span className="text-secondary-db-100 font-medium">Beta Access: Unlimited Credits</span>}
            </span>
          </div>

          {!earlyAccess && (
            <button
              type="button"
              onClick={() => window.location.href = "/get-early-access"}
              className="inline-flex items-center rounded-md bg-primary-way-10 px-4 py-1.5 text-sm font-medium text-primary-way-100 border border-primary-way-10 hover:bg-primary-way-20 cursor-pointer transition"
            >
              Join Waitlist
            </button>
          )}

          {earlyAccess && (
            <span className="inline-flex items-center rounded-md bg-secondary-db-5 px-4 py-1.5 text-xs font-medium text-secondary-db-70 border border-secondary-db-10">
              Upgraded
            </span>
          )}
        </div>

        {/* Conditional Panels */}
        {!earlyAccess && (
          <div className="mt-5 rounded-md bg-tertiary-orange-100 p-4" role="alert">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Image
                  src="/icons/info-orange.svg"
                  alt="Warning Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <p className="text-sm text-tertiary-orange-500">
                  Waysorted credits will become available once you get early access.
                </p>
              </div>
            </div>
          </div>
        )}

        {(earlyAccess) && (
          <div className="mt-5 flex flex-col space-y-6 rounded-md border border-blue-100 bg-primary-way-10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-2">
                <Image
                  src="/icons/info-1.svg"
                  alt="Info Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <p className="text-sm text-primary-way-100 -translate-y-1">You&apos;re on the Beta Plan! <br></br>
                  You now have unlimited plugin credits, giving you complete, uninterrupted access across Waysorted.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.open("https://www.figma.com", "_blank")}
              className="bg-primary-way-10 border border-primary-way-100 w-32 rounded-lg hover:bg-primary-way-20 text-sm font-medium text-primary-way-100 px-2 py-1.5 cursor-pointer"
            >
              Go to Figma
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
