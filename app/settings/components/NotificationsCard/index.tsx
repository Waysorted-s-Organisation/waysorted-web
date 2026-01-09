"use client";

import Image from "next/image";
import { useState } from "react";
import type { IUser } from "@/models/user";

type Props = {
  user: IUser;
};

export default function NotificationsCard({ user }: Props) {
  const { hasAnyNotifications, notifications } = user;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleUnsubscribe = async () => {
    if (!user.email) {
      setToast({ message: "No email found in session", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: data.message || "Successfully unsubscribed!",
          type: "success"
        });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ message: data.error || "Failed to unsubscribe", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      setToast({ message: "Failed to unsubscribe. Please try again.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={handleUnsubscribe}
                disabled={isSubmitting}
                type="button"
                className="bg-red-50 outline outline-1 outline-red-600 rounded-lg text-sm font-medium text-red-600 p-2 cursor-pointer hover:bg-red-100 hover:outline hover:outline-1 hover:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Unsubscribing..." : "Unsubscribe"}
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
          {toast.message}
        </div>
      )}
    </section>
  );
}
