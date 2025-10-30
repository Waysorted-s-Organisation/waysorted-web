"use client";
import Image from "next/image";

export default function ViewToggle({
  isGridView,
  setIsGridView,
}: {
  isGridView: boolean;
  setIsGridView: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-0 border border-secondary-db-5 rounded-md overflow-hidden">
      <button
        onClick={() => setIsGridView(false)}
        title="List View"
        className={`p-3 transition cursor-pointer h-9 w-9 ${
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
      <button
        onClick={() => setIsGridView(true)}
        title="Grid View"
        className={`p-3 transition cursor-pointer h-9 w-9 ${
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
  );
}