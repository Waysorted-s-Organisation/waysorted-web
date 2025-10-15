"use client";
import Image from "next/image";
import {SearchAndViewProps} from "../../types";

export default function SearchAndViewToggle({
  searchTerm,
  setSearchTerm,
  isGridView,
  setIsGridView,
}: SearchAndViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-5 my-6 md:my-12 flex items-center justify-between gap-3 md:gap-0">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-0 md:flex-none md:w-72">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-md pl-10 font-normal pr-4 py-2 text-sm w-full bg-secondary-db-5 text-secondary-db-70 focus:outline focus:outline-secondary-db-20"
        />
        <Image
          src="/icons/search.svg"
          alt="Search"
          width={16}
          height={16}
          className="absolute left-3 top-2.5"
        />
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-0 border border-secondary-db-5 rounded-md overflow-hidden">
        {/* List View */}
        <button
          onClick={() => setIsGridView(false)}
          title="List View"
          className={`p-2.5 md:p-3 transition cursor-pointer h-9 w-9 ${
            !isGridView ? "bg-primary-way-10" : "bg-white"
          }`}
        >
          <Image
            src={isGridView ? "/icons/list-view-black.svg" : "/icons/list-view-blue.svg"}
            alt="List View"
            width={18}
            height={12}
          />
        </button>

        {/* Grid View */}
        <button
          onClick={() => setIsGridView(true)}
          title="Grid View"
          className={`p-2.5 md:p-3 transition cursor-pointer h-9 w-9 ${
            isGridView ? "bg-primary-way-10" : "bg-white"
          }`}
        >
          <Image
            src={isGridView ? "/icons/card-view-blue.svg" : "/icons/card-view-black.svg"}
            alt="Grid View"
            width={12}
            height={12}
          />
        </button>
      </div>
    </div>
  );
}