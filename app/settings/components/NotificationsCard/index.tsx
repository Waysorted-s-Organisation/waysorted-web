"use client";

import Image from "next/image";
import type { IUser } from "@/models/user";

type Props = {
  user: IUser;
};

export default function NotificationsCard({ user }: Props) {
  const { hasAnyNotifications, notifications } = user;
  const handleSubscribe = () => {
    console.log("Subscribe to newsletter");
  }

  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h2 className="text-base font-medium text-secondary-db-100">Notifications</h2>
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
                onClick={handleSubscribe}
                type="button"
                className="bg-primary-way-10 outline outline-1 outline-primary-way-100 rounded-lg text-sm font-medium text-primary-way-100 p-2 cursor-pointer hover:bg-primary-way-30 hover:outline hover:outline-1 hover:outline-primary-way-100"
              >
                Subscribe Newsletter
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications?.map((notification) => (
                <button
                  key={notification.id}
                  className="w-full text-left rounded-lg px-4 py-4 transition flex items-start justify-between gap-4 cursor-pointer bg-white hover:bg-primary-way-10"
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
