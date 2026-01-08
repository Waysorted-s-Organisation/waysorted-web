"use client";

import { useState, useRef, useTransition } from "react";
import type { IUser } from "@/models/user";
import { updateName, removeProfilePicture, updateProfilePicture } from "@/app/actions/profile";
import Image from "next/image";

export default function ProfileCard({ user }: { user: IUser }) {
  const [name, setName] = useState(user.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPendingName, startNameTransition] = useTransition();
  const [isPendingPhoto, startPhotoTransition] = useTransition();

  // Handle Name Save
  const handleSaveName = () => {
    // Use the name-specific transition
    startNameTransition(async () => {
      const result = await updateName(name);
      if (result.success) {
        setIsEditingName(false);
      } else {
        alert("Failed to update name");
      }
    });
  };

  // Handle Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max 2MB.");
      return;
    }

    // Use the photo-specific transition
    startPhotoTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);

      const result = await updateProfilePicture(formData);
      if (!result.success) {
        alert("Failed to update picture");
      }
    });
  };

  // Handle Remove Image
  const handleRemovePhoto = () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;

    // Use the photo-specific transition
    startPhotoTransition(async () => {
      const result = await removeProfilePicture();
      if (!result.success) {
        alert("Failed to remove picture");
      }
    });
  };

  return (
    <section className="max-w-4xl rounded-lg border border-secondary-db-5 bg-white">
      {/* ... Header ... */}
      <header className="px-3 sm:px-5 py-3 border-b border-secondary-db-5">
        <h2 className="text-base font-medium text-secondary-db-100">Profile Details</h2>
        <p className="text-sm text-secondary-db-80 font-medium">Settings and details of your ID</p>
      </header>

      <div className="px-3 sm:px-6 pb-6 pt-4">
        {/* Profile Avatar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* ... Image Rendering Logic ... */}
          <div className="relative">
            {user.picture ? (
              <Image
                src={user.picture}
                alt="Profile"
                height={96}
                width={96}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border border-secondary-db-5"
              />
            ) : (
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl text-xl sm:text-2xl font-semibold text-primary-way-100 bg-primary-way-10">
                {user.initials}
              </div>
            )}

            {user.earlyAccess && (
              <span className="border border-tertiary-voilet-500 bg-tertiary-voilet-100 text-tertiary-voilet-500 px-2 py-1 text-[10px] sm:text-[12px] font-medium rounded-md absolute -bottom-2 left-3 shadow-sm">
                Early Bird
              </span>
            )}
          </div>

          {/* Change photo & Remove */}
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPendingPhoto}
              className="border border-transparent outline outline-primary-way-100 hover:bg-primary-way-20 rounded-lg text-xs sm:text-sm font-medium text-primary-way-100 p-2 cursor-pointer transition disabled:opacity-50"
            >
              {isPendingPhoto ? "Updating..." : "Change photo"}
            </button>

            {user.picture && (
              <button
                onClick={handleRemovePhoto}
                disabled={isPendingPhoto}
                className="underline hover:bg-red-50 hover:text-red-600 rounded-lg text-xs sm:text-sm font-medium text-primary-way-100 p-2 cursor-pointer transition disabled:opacity-50"
              >
                Remove
              </button>
            )}
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
                    className={`bg-primary-way-5 border w-full sm:w-md rounded-lg px-4 py-3 text-sm text-secondary-db-100 focus:outline-none focus:ring-2 focus:ring-primary-way-100 transition ${isEditingName ? "border-primary-way-100 bg-white" : "border-primary-way-20"
                      }`}
                    placeholder="Your name"
                    disabled={!isEditingName || isPendingName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  {isEditingName ? (
                    <div className="flex gap-2 ml-2 sm:ml-4">
                      <button
                        onClick={handleSaveName}
                        disabled={isPendingName}
                        className="bg-primary-way-100 text-white border border-primary-way-100 hover:bg-primary-way-80 rounded-lg px-4 sm:px-6 py-2 transition disabled:opacity-70 cursor-pointer"
                      >
                        {isPendingName ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setName(user.name || "");
                        }}
                        disabled={isPendingName}
                        className="bg-white text-secondary-db-80 border border-secondary-db-20 hover:bg-secondary-db-5 rounded-lg px-3 py-2 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="bg-primary-way-5 border border-primary-way-1 text-primary-way-100 hover:bg-primary-way-20 rounded-lg px-6 sm:px-8 py-2 ml-2 sm:ml-4 transition cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
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
                    className="bg-primary-way-5 border border-primary-way-20 w-full sm:w-md rounded-lg px-4 py-3 text-sm text-secondary-db-100 cursor-not-allowed opacity-70"
                    type="email"
                    value={user.email}
                    disabled
                  />
                  <button
                    className="bg-primary-way-5 border border-primary-way-1 text-primary-way-100 rounded-lg px-6 sm:px-8 py-2 ml-2 sm:ml-4 cursor-not-allowed opacity-50"
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