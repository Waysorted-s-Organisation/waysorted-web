"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";

export default function ProfileDropdown() {
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login"); // Navigate to login after logout
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const getInitials = (name?: string) =>
    (name || "User")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join("");

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        className="bg-primary-way-20 text-primary-way-100 border border-primary-way-100 font-medium text-base w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer hover:bg-primary-way-30 transition-colors"
        title={user.name}
        aria-label="User menu"
        onClick={() => setOpen((o) => !o)}
      >
        {getInitials(user.name)}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-secondary-db-5 shadow-lg rounded-2xl overflow-hidden z-50">
          {/* Profile header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-secondary-db-5">
            <div className="w-10 h-10 rounded-lg bg-primary-way-20 border border-primary-way-100 flex items-center justify-center font-semibold text-primary-way-100">
              {getInitials(user.name)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-secondary-db-100 text-sm truncate">{user.name || "User"}</p>
              <p className="text-xs text-secondary-db-70 font-medium truncate">{user.email}</p>
            </div>
          </div>

          {/* Workspace */}
          <div className="px-4 py-3 border-b border-secondary-db-5">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-regular text-secondary-db-70">Your Workspace</span>
              <span className="text-xs font-medium text-primary-way-100 bg-primary-way-10 px-2 py-0.5 rounded-md">
                Unlock’s soon
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <Image src="/icons/upcoming.svg" alt="Upcoming" width={40} height={40} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-primary-way-100">
                  Waystudio
                </p>
                <p className="text-xs text-secondary-db-70">All Tools in one way!</p>
              </div>
            </div>
          </div>

          {/* My profile section */}
          <div className="px-4 py-2 text-xs text-secondary-db-70">My profile</div>
          <div className="flex flex-col pb-2">
            <MenuItem
              icon="/icons/account-settings.svg"
              label="Account settings"
              onClick={() => {
                router.push("/settings");
                setOpen(false);
              }}
            />
            <MenuItem
              icon="/icons/your-requests.svg"
              label="Your requests"
              onClick={() => {
                router.push("/requests?view=mine");
                setOpen(false);
              }}
            />
            <MenuItem
              icon="/icons/help.svg"
              label="Help"
              onClick={() => {
                router.push("/support");
                setOpen(false);
              }}
            />
            <MenuItem
              icon="/icons/logout.svg"
              label="Logout"
              onClick={handleLogout}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-db-100 hover:bg-primary-way-10 transition-colors text-left cursor-pointer w-full"
      onClick={onClick}
    >
      <Image src={icon} alt={label} width={18} height={18} />
      <span>{label}</span>
    </button>
  );
}
