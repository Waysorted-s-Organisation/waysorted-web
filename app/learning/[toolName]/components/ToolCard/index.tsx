"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tool } from "@/app/learning/types";

function badgeToneClasses(tone: Tool["badge"] extends infer B ? B extends { tone: infer T } ? T : never : never) {
  switch (tone) {
    case "green":
      return "bg-tertiary-green-500 text-white";
    case "blue":
      return "bg-primary-way-10 text-primary-way-100";
    case "gray":
    default:
      return "bg-secondary-db-10 text-secondary-db-70";
  }
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const router = useRouter();
  const isDisabled = tool.disabled === true;

  const onLearnMore = () => {
    if (isDisabled) return;
    router.push(`/learning/${tool.slug}`);
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-secondary-db-5 p-4 relative ${
        isDisabled ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2 relative">
        <div className="w-12 h-12 rounded-xl bg-gray-200 relative overflow-hidden">
          <Image
            src={tool.icon}
            alt={tool.name}
            width={60}
            height={60}
            className="object-contain"
          />
        </div>

        {(tool.badge?.label || tool.isNew) && (
          <span
            className={`absolute top-0 right-0 text-xs px-3 py-1 rounded-md font-medium ${badgeToneClasses(
              tool.badge?.tone || (tool.isNew ? "green" : "gray")
            )}`}
          >
            {tool.badge?.label || "New"}
          </span>
        )}
      </div>

      <h2 className="font-medium text-xl text-secondary-db-100">{tool.name}</h2>

      <a className="text-xs text-secondary-db-70 cursor-default">
        <Image
          src="/icons/open.svg"
          alt="Open in Figma"
          width={12}
          height={12}
          className="inline object-contain mr-1"
        />
        Figma Plugin
      </a>

      <p className="text-secondary-db-70 font-medium text-sm mt-3">{tool.description}</p>

      <button
        onClick={onLearnMore}
        aria-label={isDisabled ? "Coming soon" : "Learn more about this tool"}
        className={`mt-4 text-sm font-medium flex items-center ${
          isDisabled
            ? "text-secondary-db-40 cursor-not-allowed"
            : "text-secondary-db-100 hover:text-primary-way-100 cursor-pointer"
        }`}
      >
        Learn more
        <span className="relative ml-1 w-3 h-2">
          <Image
            src="/icons/arrow-right-black.svg"
            alt="Arrow Right"
            fill
            className="object-contain"
          />
        </span>
      </button>
    </div>
  );
}