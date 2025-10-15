"use client";

import { useState } from "react";
import { User } from "@/hooks/useUser";

export default function ProfileCard({ user }: { user: User }) {
  const [editing, setEditing] = useState<{ name: boolean }>({ name: false });
  const [form, setForm] = useState({ name: user.name });

  // Server save function
  async function saveName() {
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      setEditing({ name: false });
    } catch (err) {
      console.error(err);
      alert("Error saving name");
    }
  }

  return (
    <section className="max-w-4xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-3 sm:px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Profile Details</h1>
        <p className="text-sm text-secondary-db-80 font-medium">Settings and details of your ID</p>
      </header>

      <div className="px-3 sm:px-6 pb-6 pt-4">
        {/* Profile Avatar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="relative">
            <div
              className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl text-xl sm:text-2xl font-semibold text-primary-way-100 bg-primary-way-10"
              aria-label="Profile avatar"
            >
              {user.initials}
            </div>
            {user.earlyAccess && (
              <span className="border border-tertiary-voilet-500 bg-tertiary-voilet-100 text-tertiary-voilet-500 px-2 py-1 text-[10px] sm:text-[12px] font-medium rounded-md absolute -bottom-2 left-3">
                Early Bird
              </span>
            )}
          </div>

          {/* Change photo & Remove always inline, never stack */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="border border-transparent outline outline-primary-way-100 hover:bg-primary-way-20 rounded-lg text-xs sm:text-sm font-medium text-primary-way-100 p-2 cursor-pointer transition">
              Change photo
            </button>
            <button className="underline hover:bg-primary-way-20 rounded-lg text-xs sm:text-sm font-medium text-primary-way-100 p-2 cursor-pointer transition">
              Remove
            </button>
          </div>
        </div>

        {/* Name & Email */}
        <div className="mt-6 flex flex-col gap-5 sm:gap-6">
          <div className="flex items-center">
            <div className="flex-1">
              <label className="field w-full">
                <div className="text-secondary-db-100 text-xs sm:text-sm p-1">Name</div>
                <div className="flex w-full">
                  <input
                    className="bg-primary-way-5 border border-primary-way-20 w-full sm:w-md rounded-lg px-4 py-3 text-sm text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 transition"
                    placeholder="Your name"
                    disabled={!editing.name}
                    value={form.name}
                    onChange={(e) => setForm({ name: e.target.value })}
                  />
                  <button
                    className="bg-primary-way-5 border border-primary-way-10 text-primary-way-100 rounded-lg px-6 sm:px-8 py-2 ml-2 sm:ml-4 cursor-pointer transition"
                    onClick={() => (editing.name ? saveName() : setEditing({ name: true }))}
                  >
                    {editing.name ? "Save" : "Edit"}
                  </button>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-1">
              <label className="field w-full">
                <div className="text-secondary-db-100 text-xs sm:text-sm p-1">Email</div>
                <div className="flex w-full">
                  <input
                    className="bg-primary-way-5 border border-primary-way-20 w-full sm:w-md rounded-lg px-4 py-3 text-sm text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 transition"
                    type="email"
                    placeholder="you@example.com"
                    disabled
                    value={user.email}
                  />
                  <button
                    className="bg-primary-way-5 border border-primary-way-10 text-primary-way-100 rounded-lg px-6 sm:px-8 py-2 ml-2 sm:ml-4 cursor-not-allowed opacity-70"
                    disabled
                  >
                    Edit
                  </button>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="border-b border-secondary-db-5 mt-8 sm:mt-10" />

        {/* Linked Accounts */}
        <section>
          <h2 className="text-base font-medium text-secondary-db-100 mt-4">Linked Accounts</h2>
          <div className="mt-3 flex items-center justify-between rounded-lg px-0 sm:px-4 pb-6">
            <div className="flex items-center gap-6 sm:gap-16">
              <div className="flex gap-2 items-center">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary-way-10 text-slate-500">
                  G
                </div>
                <div className="text-xs sm:text-sm text-secondary-db-80">Google</div>
              </div>
              <div className="text-xs sm:text-sm text-secondary-db-100">Linked</div>
            </div>
          </div>
        </section>

        <div className="border-t border-secondary-db-5" />

        {/* Notifications */}
        <section>
          <h2 className="text-base font-medium text-secondary-db-100 mt-4">Notifications</h2>
          <p className="mt-2 text-xs sm:text-sm text-secondary-db-90">
            Receive newsletters, updates and news from Waysorted Company.
          </p>
          <p className="mt-1 text-xs font-regular leading-5 text-secondary-db-80">
            We will process your data to send you information about our products and services, promotions, surveys, and other relevant updates. You can unsubscribe at any time. For more details, please review our privacy policy.
          </p>
        </section>
      </div>
    </section>
  );
}