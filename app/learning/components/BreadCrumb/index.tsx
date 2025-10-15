"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Breadcrumb() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-5 my-6 md:my-16">
      <nav className="text-sm md:text-base font-medium text-secondary-db-100/50">
        <span
          className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
          onClick={() => router.push("/")}
        >
          Home
        </span>

        {/* Larger chevron on mobile only (keeps original size on ≥ md) */}
        <Image
          src="/icons/chevron-right.svg"
          alt="Arrow Right"
          width={8}
          height={8}
          className="inline-block mx-2 align-middle md:hidden"
        />
        <Image
          src="/icons/chevron-right.svg"
          alt="Arrow Right"
          width={1}
          height={0.25}
          className="hidden md:inline-block mx-2 align-middle"
        />

        <span
          className="text-primary-way-100 text-sm md:text-base font-medium cursor-pointer"
          onClick={() => router.push("/learning")}
        >
          Learning
        </span>
      </nav>
    </div>
  );
}