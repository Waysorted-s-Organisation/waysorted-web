"use client";

import Image from "next/image";
import type { PublicUser } from "@/app/settings/lib/user";

type Props = {
  user: PublicUser;
};

export default function NotificationsCard({ user }: Props) {
  const { hasAnyNotifications, notifications } = user;

  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Notifications</h1>
        <p className="text-sm text-secondary-db-80 font-medium">
          Never miss a plugin update or credit drop.
        </p>
      </header>

      <div className="px-6 pb-8 pt-5">
        {!hasAnyNotifications ? (
        <div className="relative mb-6 rounded-md bg-primary-way-5 p-4 text-primary-way-100">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                <Image
                    src="/icons/info-icon.svg"
                    alt="Info Icon"
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
                className="rounded-md border border-primary-way-100 bg-primary-way-5 px-3 py-1.5 text-xs font-medium text-primary-way-100 transition cursor-pointer"
                >
                Subscribe Newsletter
                </button>
            </div>
        </div>
        ) : (
          <>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
              {notifications.map((notification, i) => (
                <button
                  key={notification.id}
                  className="w-full text-left rounded-lg px-4 py-4 transition flex items-start justify-between gap-4 cursor-pointer bg-white hover:bg-primary-way-10"
                  onClick={() => alert(`Open notification ${notification.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-db-100">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-secondary-db-70">
                      {notification.body}
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
