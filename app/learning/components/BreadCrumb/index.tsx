"use client";
import Image from "next/image";
import Link from "next/link";

export default function Breadcrumb() {
  return (
    <div className="max-w-7xl mx-auto px-5 my-6 md:my-16">
      {/* These were <span onClick={router.push}>: not crawlable, and breadcrumbs
          are exactly the internal links Google uses to understand hierarchy.
          Colour moved off `text-secondary-db-100/50` (3.55:1 after the opacity
          blend) to db-70, which is 6.95:1 on white. */}
      <nav aria-label="Breadcrumb" className="text-sm md:text-base font-medium text-secondary-db-70">
        <Link
          href="/"
          className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
        >
          Home
        </Link>

        {/* Larger chevron on mobile only (keeps original size on ≥ md) */}
        <Image
          src="/icons/chevron-right.svg"
          alt=""
          aria-hidden="true"
          width={5}
          height={7}
          className="inline-block mx-2 align-middle md:hidden"
        />
        <Image
          src="/icons/chevron-right.svg"
          alt=""
          aria-hidden="true"
          width={5}
          height={7}
          className="hidden md:inline-block mx-2 align-middle"
        />

        <Link
          href="/learning"
          className="text-primary-way-100 text-sm md:text-base font-medium cursor-pointer"
        >
          Learning Hub
        </Link>
      </nav>
    </div>
  );
}
