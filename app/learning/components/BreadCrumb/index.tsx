"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Breadcrumb() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-5 my-16">
      <nav className="text-base font-medium text-secondary-db-100/50">
        <span
          className="cursor-pointer hover:text-secondary-db-100 hover:border-b-2 hover:border-b-primary-way-100"
          onClick={() => router.push("/")}
        >
          Home
        </span>
        <Image
          src="/icons/chevron-right.svg"
          alt="Arrow Right"
          width={4}
          height={4}
          className="inline-block mx-2"
        />
        <span
          className="text-primary-way-100 text-base font-medium cursor-pointer"
          onClick={() => router.push("/learning")}
        >
          Learning
        </span>
      </nav>
    </div>
  );
}
