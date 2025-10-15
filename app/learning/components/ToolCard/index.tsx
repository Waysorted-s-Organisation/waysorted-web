"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ITool } from "@/models/tool";
import { Badge } from "@/app/learning/components/Badge";

export default function ToolCard({ tool }: { tool: ITool }) {
  const router = useRouter();
  const isDisabled = tool.disabled === true;
  const badge = tool.badge;

  const onLearnMore = () => {
    if (isDisabled) return;
    router.push(`/learning/${tool.slug}`);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (isDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLearnMore();
    }
  };

  return (
    <div
      onClick={onLearnMore}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={
        isDisabled
          ? `${tool.name} is coming soon`
          : `Learn more about ${tool.name}`
      }
      className={`bg-white rounded-2xl border border-secondary-db-5 p-3 sm:p-4 relative outline-none ${
        isDisabled
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-primary-way-5 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-way-100"
      }`}
    >
      <div className="flex items-center justify-between mb-2 relative">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200 relative overflow-hidden">
          <Image
            src={`${tool.iconData}`}
            alt={tool.name}
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
        {badge && (
          <Badge type={badge.type} label={badge.label} showDot={false} />
        )}
      </div>

      <h2 className="font-medium text-lg sm:text-xl text-secondary-db-100">
        {tool.name}{" "}
        {/* {tool.isAI && (
          <Image
            src={`${tool.AIIcon}`}
            alt={`${tool.name} AI`}
            width={20}
            height={20}
            className="inline-block ml-1"
          />
        )} */}
      </h2>

      {/* Hide on very small screens to keep the card compact */}
      <span className="hidden sm:inline text-xs text-secondary-db-70 select-none">
        <Image
          src="/icons/open.svg"
          alt="Open in Figma"
          width={12}
          height={12}
          className="inline object-contain mr-1"
        />
        Figma Plugin
      </span>

      <p className="text-secondary-db-70 font-medium text-xs sm:text-sm mt-2 sm:mt-3">
        {tool.shortDescription}
      </p>

      <div
        className={`mt-3 sm:mt-4 text-sm font-medium flex items-center ${
          isDisabled ? "text-secondary-db-40" : "text-primary-way-100"
        }`}
      >
        Learn more
        <span className="relative ml-1 w-3 h-2">
          <svg
            width="6"
            height="10"
            viewBox="0 0 6 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 9L4.64645 5.35355C4.84171 5.15829 4.84171 4.84171 4.64645 4.64645L1 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}