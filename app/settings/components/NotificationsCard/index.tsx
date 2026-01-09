"use client";

import Image from "next/image";
import { useState } from "react";
import type { IUser } from "@/models/user";

type Props = {
  user: IUser;
};

export default function NotificationsCard({ user }: Props) {
  const { hasAnyNotifications, notifications } = user;
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState(user.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleUnsubscribe = async () => {
    if (!emailIsValid(email)) {
      setToast({ message: "Please enter a valid email address", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: data.message || "Successfully unsubscribed!",
          type: "success"
        });
        setShowModal(false);
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
                onClick={() => setShowModal(true)}
                type="button"
                className="bg-primary-way-10 outline outline-1 outline-primary-way-100 rounded-lg text-sm font-medium text-primary-way-100 p-2 cursor-pointer hover:bg-primary-way-30 hover:outline hover:outline-1 hover:outline-primary-way-100"
              >
                Unsubscribe
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

      {/* Newsletter Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-db-100">Unsubscribe from Newsletter</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-secondary-db-60 hover:text-secondary-db-100"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-secondary-db-80 mb-4">
              Confirm your email to unsubscribe from plugin updates and credit drops.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-secondary-db-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-way-60 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-secondary-db-20 rounded-lg text-secondary-db-80 hover:bg-secondary-db-5"
              >
                Cancel
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={isSubmitting || !emailIsValid(email)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Unsubscribing..." : "Unsubscribe"}
              </button>
            </div>
          </div>
        </div>
      )}

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
