"use client";

import Image from "next/image";
import type { IUser } from "@/types/user";

type Props = {
  user: IUser;
};

export default function SubscriptionCard({ user }: Props) {
  const { earlyAccess } = user;

  const startedDisplay = earlyAccess && user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "N/A";
  const renewalDisplay = null;
  const statusDisplay = earlyAccess ? "Active" : "N/A";

  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h2 className="text-base font-medium text-secondary-db-100">Subscription</h2>
        <p className="text-sm text-secondary-db-80 font-medium">
          Stay on top of your plan and benefits.
        </p>
      </header>

      <div className="px-6 pb-8 pt-5">
        {/* Plan Info */}
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-medium text-secondary-db-90 flex items-center gap-2">
            Your Plan
            {earlyAccess && (
              <span className="inline-flex items-center rounded-sm bg-success-100 px-2 py-1/2 text-xs font-medium text-success-500 border border-success-100">
                Beta Access
              </span>
            )}
          </h2>
        </div>

        {/* Alerts / Info */}
        {!earlyAccess ? (
          <div className="relative mb-6 rounded-md bg-error-100 p-4 text-error-500">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/info-red.svg"
                  alt="Error Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <p className="text-sm text-error-500 font-medium">
                  You don&apos;t have any active Subscription!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col space-y-6 rounded-md border border-blue-100 bg-primary-way-10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-4">
                  <Image
                    src="/icons/info-1.svg"
                    alt="Info Icon"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <p className="text-sm text-primary-way-100">
                    You&apos;re on an Beta Access plan! Enjoy unlimited plugin usage, early feature drops, and full Waysorted access, you&apos;re officially part of the Beta Crew.
                  </p>
                </div>
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

        {/* Meta Info */}
        <div className="my-6 grid grid-cols-1 text-sm space-y-2">
          <div className="inline-block space-x-1">
            <span className="text-secondary-db-70">Status:</span>
            <span className="font-medium text-secondary-db-100">{statusDisplay}</span>
          </div>
          <div className="inline-block space-x-1">
            <span className="text-secondary-db-70">Started On:</span>
            <span className="font-medium text-secondary-db-100">{startedDisplay}</span>
          </div>
          <div className="inline-block space-x-1">
            <span className="text-secondary-db-70">Next Renewal:</span>
            <span className="font-medium text-secondary-db-100">{renewalDisplay ?? "N/A"}</span>
          </div>
        </div>

        {/* Credits */}
        <div className="flex flex-col gap-4 rounded-md border border-secondary-db-5 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Image
              src="/icons/clock.svg"
              alt="Credits Icon"
              width={16}
              height={19}
              className="object-contain"
            />
            <span className="text-secondary-db-100">
              <span className="font-semibold">
                {earlyAccess ? "∞" : "0"}
              </span> /
              {earlyAccess ? " ∞" : " 0"} credits left
            </span>
          </div>

          {earlyAccess && (
            <span className="inline-flex items-center rounded-md bg-secondary-db-5 px-4 py-1.5 text-xs font-medium text-secondary-db-70 border border-secondary-db-10">
              Upgraded
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
