"use client";
import Image from "next/image";

import type { User } from "@/hooks/useUser";

export interface BetaFeaturesCardProps {
  user: User;
  features: {
    id: string;
    title: string;
    description: string;
  }[];
}

export default function BetaFeaturesCard({ user, features }: BetaFeaturesCardProps) {
  const { earlyAccess } = user;
  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Beta features</h1>
        <p className="text-sm text-secondary-db-80 font-medium">
          Exclusive early access to our smartest features.
        </p>
      </header>

      <div className="px-6 pb-8 pt-5">
        {/* Top Panel */}
        {!earlyAccess ? (
            <div className="relative mb-6 rounded-md bg-tertiary-vivid-blue-100 p-4 text-tertiary-vivid-blue-500">
                <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Image
                        src="/icons/lightning.svg"
                        alt="Error Icon"
                        width={16}
                        height={16}
                        className="object-contain"
                    />
                    <p className="text-sm font-medium">
                    You don&apos;t have any active Subscription!
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => alert("Open early access / subscription flow")}
                    className="rounded-md border border-tertiary-vivid-blue-500 bg-tertiary-vivid-blue-100 px-3 py-1.5 text-xs font-medium text-tertiary-vivid-blue-500 transition cursor-pointer"
                >
                    Get Early Access
                </button>
                </div>
            </div>
        ) : (
          <div className="relative mb-6 rounded-md bg-tertiary-vivid-blue-100 p-4 text-tertiary-vivid-blue-500">
                <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Image
                        src="/icons/lightning.svg"
                        alt="Error Icon"
                        width={16}
                        height={16}
                        className="object-contain"
                    />
                    <p className="text-sm font-medium">
                    You &apos;re already part of the Beta Program. Thanks for helping us shape Waysorted!
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => alert("Open feedback modal")}
                    className="rounded-md border border-tertiary-vivid-blue-500 bg-tertiary-vivid-blue-100 px-3 py-1.5 text-xs font-medium text-tertiary-vivid-blue-500 transition cursor-pointer"
                >
                    Get Early Access
                </button>
                </div>
            </div>
        )}

        {/* Feature List */}
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li
              key={f.id}
              className="rounded-md px-4 py-4 hover:bg-primary-way-10 transition cursor-pointer"
            >
              <p className="text-sm font-medium text-secondary-db-100">
                {f.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-secondary-db-100">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}