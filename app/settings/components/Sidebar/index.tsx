"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";

const items = [
  { key: "general", label: "General" },
  { key: "credits", label: "Credits Usage" },
  { key: "subscription", label: "Subscription" },
  { key: "notifications", label: "Notifications" },
  { key: "integrations", label: "Integrations" },
  { key: "beta", label: "Beta Features" },
];

export default function Sidebar() {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") || "general";

  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-48px)] w-64 shrink-0 border-r border-secondary-db-5 bg-white px-4 pb-6 pt-4 lg:block">
      <div className="mb-2 flex flex-col gap-2 border-b border-secondary-db-5 pb-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/icons/waycon.svg"
            alt="Waysorted Logo"
            width={32}
            height={32}
            className="object-contain mr-2"
          />
          <div className="text-base font-semibold text-secondary-db-100">
            Waysorted
          </div>
        </Link>
      </div>

      <nav>
        <Link
          href="/"
          title="Back to home"
          aria-label="Back to home"
          className="inline-flex items-center gap-1 text-sm text-secondary-db-70 rounded-md border border-secondary-db-5 mb-6 px-3 py-1 hover:bg-secondary-db-5 hover:text-secondary-db-100 transition-all duration-200"
        >
          <span className="text-lg">‹</span> Back home
        </Link>

        <div className="px-2">
          <h2 className="mb-4 text-base font-medium text-secondary-db-100">
            Settings
          </h2>
          <ul className="space-y-2 text-sm font-semibold text-secondary-db-90">
            {items.map((item) => {
              const href = `/settings?tab=${item.key}`;
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    className={clsx(
                      "block rounded-lg px-3 py-2 transition",
                      isActive
                        ? "bg-primary-way-10 text-primary-way-100"
                        : "hover:bg-primary-way-5"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}