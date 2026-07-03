"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { IUser } from "@/types/user";

type Props = {
  user: IUser;
};

type PreferenceCategory = {
  key: string;
  label: string;
  description: string;
};

type PreferenceStatus = "subscribed" | "unsubscribed";
type Preferences = Record<string, PreferenceStatus>;

export default function NotificationsCard({ user }: Props) {
  const { hasAnyNotifications, notifications } = user;
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/newsletter/preferences", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!isActive) return;
        if (data.success) {
          setCategories(data.categories || []);
          setPreferences(data.preferences || {});
        } else {
          setToast({
            message: data.error || "Failed to load preferences",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Newsletter preferences load error:", error);
        if (isActive) {
          setToast({
            message: "Failed to load preferences",
            type: "error",
          });
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadPreferences();

    return () => {
      isActive = false;
    };
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setCategoryStatus = (key: string, checked: boolean) => {
    setPreferences((current) => ({
      ...current,
      [key]: checked ? "subscribed" : "unsubscribed",
    }));
  };

  const savePreferences = async (unsubscribeAll = false) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences,
          unsubscribeAll,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences || {});
        showToast(data.message || "Preferences updated", "success");
      } else {
        showToast(data.error || "Failed to update preferences", "error");
      }
    } catch (error) {
      console.error("Newsletter preferences update error:", error);
      showToast("Failed to update preferences. Please try again.", "error");
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

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-secondary-db-100">
              Email preferences
            </h3>
            <p className="mt-1 text-sm text-secondary-db-70">
              Manage the newsletter and product emails sent to {user.email}.
            </p>
          </div>

          <div className="divide-y divide-secondary-db-5 border-y border-secondary-db-5">
            {isLoading ? (
              <p className="py-4 text-sm text-secondary-db-70">Loading preferences...</p>
            ) : (
              categories.map((category) => (
                <label
                  key={category.key}
                  className="flex cursor-pointer items-start justify-between gap-4 py-4"
                >
                  <span>
                    <span className="block text-sm font-medium text-secondary-db-100">
                      {category.label}
                    </span>
                    <span className="mt-1 block text-sm text-secondary-db-70">
                      {category.description}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences[category.key] !== "unsubscribed"}
                    onChange={(event) =>
                      setCategoryStatus(category.key, event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-primary-way-100"
                  />
                </label>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => savePreferences(true)}
              disabled={isSubmitting || isLoading}
              className="rounded-lg border border-secondary-db-10 px-4 py-2 text-sm font-medium text-secondary-db-80 hover:bg-secondary-db-5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Unsubscribe all
            </button>
            <button
              type="button"
              onClick={() => savePreferences(false)}
              disabled={isSubmitting || isLoading}
              className="rounded-lg bg-primary-way-100 px-4 py-2 text-sm font-medium text-white hover:bg-primary-way-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save preferences"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "success" ? "bg-primary-way-5 text-primary-way-100" : "bg-primary-way-5 text-primary-way-100"
          }`}>
          {toast.message}
        </div>
      )}
    </section>
  );
}
