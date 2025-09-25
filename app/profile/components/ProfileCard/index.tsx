"use client";

import { useMemo, useState } from "react";

type Props = {
  initials: string;
  earlyAccess: boolean;
  name?: string;
  email?: string;
};

export default function ProfileCard({ initials, earlyAccess, name = "", email = "" }: Props) {
  const [editing, setEditing] = useState<{ name: boolean; email: boolean }>({
    name: false,
    email: false,
  });
  const [form, setForm] = useState({ name, email });

  return (
    <section className="max-w-4xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Profile Details</h1>
        <p className="text-sm text-secondary-db-80 font-medium">Settings and details of your ID</p>
      </header>

      <div className="px-6 pb-6 pt-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-semibold text-primary-way-100 bg-primary-way-10"
              aria-label="Profile avatar"
            >
              {initials}
            </div>
            {earlyAccess && (
              <span className="border border-tertiary-voilet-500 bg-tertiary-voilet-100 text-tertiary-voilet-500 px-2 py-1 text-[12px] font-medium rounded-md absolute -bottom-2 left-3">Early Bird</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="border border-transparent hover:outline hover:outline-primary-way-100 rounded-lg text-sm font-medium text-primary-way-100 p-2 cursor-pointer">Change photo</button>
            <button className="border border-transparent hover:outline hover:outline-primary-way-100 rounded-lg text-sm font-medium text-primary-way-100 p-2 cursor-pointer">Remove</button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center">
                <div className="flex-1">
                <label className="field">
                    <div className="text-secondary-db-100 font-regular text-sm p-1">Name</div>
                    <input
                    className="bg-primary-way-5 border border-primary-way-20 w-md rounded-lg px-4 py-3 text-sm text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition"
                    placeholder="Your name"
                    disabled={!editing.name}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <button
                    className="bg-primary-way-5 border border-primary-way-10 text-primary-way-100 rounded-lg px-8 py-2 ml-4"
                    onClick={() => setEditing((s) => ({ ...s, name: !s.name }))}
                    >
                    {editing.name ? "Save" : "Edit"}
                    </button>
                </label>
                </div>
                
            </div>

            <div className="flex items-center justify-between">
                <div className="flex-1">
                <label className="field">
                    <div className="text-secondary-db-100 font-regular text-sm p-1">Email</div>
                    <input
                    className="bg-primary-way-5 border border-primary-way-20 w-md rounded-lg px-4 py-3 text-sm text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 focus:border-primary transition"
                    type="email"
                    placeholder="you@example.com"
                    disabled={!editing.email}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    <button
                    className="bg-primary-way-5 border border-primary-way-10 text-primary-way-100 rounded-lg px-8 py-2 ml-4"
                    onClick={() => setEditing((s) => ({ ...s, email: !s.email }))}
                    >
                    {editing.email ? "Save" : "Edit"}
                    </button>
                </label>

                </div>
                
            </div>
            </div>

        <div className="border-b border-secondary-db-5 mt-10" />

        <section>
          <h2 className="text-base font-medium text-secondary-db-100 mt-4">Linked Accounts</h2>
          <div className="mt-3 flex items-center justify-between rounded-lg px-4 pb-6">
            <div className="flex items-center gap-16">
              <div className="flex gap-2 items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-way-10 text-slate-500">
                G
              </div>
            <div className="text-sm font-regular text-secondary-db-80">Google</div>
            </div>
            <div className="text-sm font-regular text-secondary-db-100">Linked</div>
            </div>
          </div>
        </section>

        <div className="border-t border-secondary-db-5" />

        <section>
          <h2 className="text-base font-medium text-secondary-db-100 mt-4">Notifications</h2>
          <p className="mt-2 text-sm text-secondary-db-90">
            Receive newsletters, updates and news from Waysorted Company.
          </p>
          <p className="mt-1 text-xs leading-5 text-secondary-db-80">
            We will process your data to send you information about our products and services, promotions, surveys,
            raffles, based on our legitimate interest, and updates from the creators you follow, if you have consented
            to this. Your data will not be disclosed to third parties. They will be communicated outside the EU under
            the terms of the privacy policy. You can opt out of our notifications with the slider.
          </p>
        </section>
      </div>
    </section>
  );
}