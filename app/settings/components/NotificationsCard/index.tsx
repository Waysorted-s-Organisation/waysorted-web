"use client";

import { useState } from "react";
import Image from "next/image";

export type NotificationsCardProps = {
    hasAny: boolean;  // false -> show "No notification" red panel
  categories?: { id: string; title: string; body: string }[]; // used when hasAny = true
};

export default function NotificationsCard({ hasAny, categories = [] }: NotificationsCardProps) {

  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Notifications</h1>
        <p className="text-sm text-secondary-db-80 font-medium">
          Never miss a plugin update or credit drop.
        </p>
      </header>

      <div className="px-6 pb-8 pt-5">
        {!hasAny ? (
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
                <p className="text-sm font-medium">
                    No notification for now!
                </p>
                </div>
                <button
                type="button"
                onClick={() => alert("Open early access / subscription flow")}
                className="rounded-md border border-error-500 bg-error-100 px-3 py-1.5 text-xs font-medium text-error-500 transition cursor-pointer"
                >
                Subscribe Newsletter
                </button>
            </div>
        </div>
        ) : (
          <>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  className="w-full text-left rounded-lg px-4 py-4 transition flex items-start justify-between gap-4 cursor-pointer bg-white hover:bg-primary-way-10"
                  onClick={() => alert(`Open notification ${c.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-db-100">
                      {c.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-secondary-db-70">
                      {c.body}
                    </p>
                  </div>
                  <Image
                    src="/icons/arrow-right-gray.svg"
                    alt="Chevron Right"
                    width={16}
                    height={16}
                    className="object-contain ml-1"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}